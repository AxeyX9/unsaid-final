from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import base64
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI()

# Create API router
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ==================== MODELS ====================

class UserBase(BaseModel):
    username: str
    email: EmailStr
    displayName: str
    bio: Optional[str] = ""
    avatar: Optional[str] = None
    website: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    followersCount: int = 0
    followingCount: int = 0
    postsCount: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
class PostCreate(BaseModel):
    text: str
    imageUrl: Optional[str] = None
    mood: Optional[str] = None
    commentsEnabled: bool = True
    isAnonymous: bool = False

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    authorId: str
    text: str
    imageUrl: Optional[str] = None
    mood: Optional[str] = None
    commentsEnabled: bool = True
    isAnonymous: bool = False
    reactions: Dict[str, int] = {"black_heart": 0, "white_heart": 0, "hug": 0, "moon": 0}
    commentsCount: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    author: Optional[User] = None
    userReaction: Optional[str] = None
    isSaved: bool = False

class CommentCreate(BaseModel):
    text: str

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    postId: str
    authorId: str
    text: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    author: Optional[User] = None

class StoryCreate(BaseModel):
    text: Optional[str] = None
    imageUrl: Optional[str] = None
    videoUrl: Optional[str] = None

class Story(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    text: Optional[str] = None
    imageUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expiresAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=24))
    user: Optional[User] = None

class MessageCreate(BaseModel):
    receiverId: str
    text: str
    imageUrl: Optional[str] = None

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    senderId: str
    receiverId: str
    text: str
    imageUrl: Optional[str] = None
    isRead: bool = False
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    type: str  # 'like', 'comment', 'follow', 'mention'
    actorId: str
    postId: Optional[str] = None
    text: str
    isRead: bool = False
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    actor: Optional[User] = None

class ReelCreate(BaseModel):
    videoUrl: str
    caption: Optional[str] = None
    music: Optional[str] = None

class Reel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    authorId: str
    videoUrl: str
    caption: Optional[str] = None
    music: Optional[str] = None
    likesCount: int = 0
    commentsCount: int = 0
    viewsCount: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    author: Optional[User] = None
    isLiked: bool = False


# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)


# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "InstaSocial API"}

# Auth Routes
@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    user = User(**user_data.model_dump(exclude={'password'}))
    hashed_password = hash_password(user_data.password)
    
    user_doc = user.model_dump()
    user_doc['password'] = hashed_password
    user_doc['createdAt'] = user_doc['createdAt'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token({"sub": user.id})
    
    return {"user": user, "token": token}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    token = create_access_token({"sub": user.id})
    
    return {"user": user, "token": token}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# User Routes
@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_doc)

@api_router.get("/users/search/{query}")
async def search_users(query: str, current_user: User = Depends(get_current_user)):
    users = await db.users.find({
        "$or": [
            {"username": {"$regex": query, "$options": "i"}},
            {"displayName": {"$regex": query, "$options": "i"}}
        ]
    }, {"_id": 0, "password": 0}).limit(20).to_list(20)
    return [User(**u) for u in users]

# Follow Routes
@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if already following
    existing = await db.follows.find_one({"followerId": current_user.id, "followingId": user_id})
    if existing:
        # Unfollow
        await db.follows.delete_one({"followerId": current_user.id, "followingId": user_id})
        await db.users.update_one({"id": current_user.id}, {"$inc": {"followingCount": -1}})
        await db.users.update_one({"id": user_id}, {"$inc": {"followersCount": -1}})
        return {"isFollowing": False}
    else:
        # Follow
        follow_doc = {
            "id": str(uuid.uuid4()),
            "followerId": current_user.id,
            "followingId": user_id,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        await db.follows.insert_one(follow_doc)
        await db.users.update_one({"id": current_user.id}, {"$inc": {"followingCount": 1}})
        await db.users.update_one({"id": user_id}, {"$inc": {"followersCount": 1}})
        
        # Create notification
        notification = Notification(
            userId=user_id,
            type="follow",
            actorId=current_user.id,
            text=f"{current_user.displayName} started following you"
        )
        notif_doc = notification.model_dump()
        notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
        await db.notifications.insert_one(notif_doc)
        
        return {"isFollowing": True}

@api_router.get("/users/{user_id}/followers")
async def get_followers(user_id: str, current_user: User = Depends(get_current_user)):
    follows = await db.follows.find({"followingId": user_id}).to_list(1000)
    follower_ids = [f['followerId'] for f in follows]
    users = await db.users.find({"id": {"$in": follower_ids}}, {"_id": 0, "password": 0}).to_list(1000)
    return [User(**u) for u in users]

@api_router.get("/users/{user_id}/following")
async def get_following(user_id: str, current_user: User = Depends(get_current_user)):
    follows = await db.follows.find({"followerId": user_id}).to_list(1000)
    following_ids = [f['followingId'] for f in follows]
    users = await db.users.find({"id": {"$in": following_ids}}, {"_id": 0, "password": 0}).to_list(1000)
    return [User(**u) for u in users]

@api_router.get("/users/{user_id}/is-following")
async def check_following(user_id: str, current_user: User = Depends(get_current_user)):
    follow = await db.follows.find_one({"followerId": current_user.id, "followingId": user_id})
    return {"isFollowing": follow is not None}

# Post Routes
@api_router.post("/posts", response_model=Post)
async def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user)):
    post = Post(**post_data.model_dump(), authorId=current_user.id)
    post_doc = post.model_dump()
    post_doc['createdAt'] = post_doc['createdAt'].isoformat()
    await db.posts.insert_one(post_doc)
    
    # Update user's post count
    await db.users.update_one({"id": current_user.id}, {"$inc": {"postsCount": 1}})
    
    post.author = current_user
    return post

@api_router.get("/feed")
async def get_feed(skip: int = 0, limit: int = 10, current_user: User = Depends(get_current_user)):
    # Get users that current user follows
    follows = await db.follows.find({"followerId": current_user.id}).to_list(1000)
    following_ids = [f['followingId'] for f in follows]
    following_ids.append(current_user.id)  # Include own posts
    
    # Get posts from followed users
    posts = await db.posts.find(
        {"authorId": {"$in": following_ids}}
    ).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich posts with author info
    result = []
    for post_doc in posts:
        if 'createdAt' in post_doc and isinstance(post_doc['createdAt'], str):
            post_doc['createdAt'] = datetime.fromisoformat(post_doc['createdAt'])
        
        post = Post(**post_doc)
        
        # Get author
        if not post.isAnonymous:
            author_doc = await db.users.find_one({"id": post.authorId}, {"_id": 0, "password": 0})
            if author_doc:
                post.author = User(**author_doc)
        
        # Check if user reacted
        reaction = await db.reactions.find_one({"postId": post.id, "userId": current_user.id})
        if reaction:
            post.userReaction = reaction['reactionType']
        
        # Check if saved
        saved = await db.saved_posts.find_one({"postId": post.id, "userId": current_user.id})
        post.isSaved = saved is not None
        
        result.append(post)
    
    return result

@api_router.get("/posts/{post_id}", response_model=Post)
async def get_post(post_id: str, current_user: User = Depends(get_current_user)):
    post_doc = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post_doc:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if isinstance(post_doc['createdAt'], str):
        post_doc['createdAt'] = datetime.fromisoformat(post_doc['createdAt'])
    
    post = Post(**post_doc)
    
    if not post.isAnonymous:
        author_doc = await db.users.find_one({"id": post.authorId}, {"_id": 0, "password": 0})
        if author_doc:
            post.author = User(**author_doc)
    
    return post

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, current_user: User = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post['authorId'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.posts.delete_one({"id": post_id})
    await db.users.update_one({"id": current_user.id}, {"$inc": {"postsCount": -1}})
    
    return {"message": "Post deleted"}

@api_router.get("/users/{user_id}/posts")
async def get_user_posts(user_id: str, current_user: User = Depends(get_current_user)):
    posts = await db.posts.find({"authorId": user_id}).sort("createdAt", -1).to_list(100)
    
    result = []
    for post_doc in posts:
        if isinstance(post_doc['createdAt'], str):
            post_doc['createdAt'] = datetime.fromisoformat(post_doc['createdAt'])
        
        post = Post(**post_doc)
        
        if not post.isAnonymous:
            author_doc = await db.users.find_one({"id": post.authorId}, {"_id": 0, "password": 0})
            if author_doc:
                post.author = User(**author_doc)
        
        reaction = await db.reactions.find_one({"postId": post.id, "userId": current_user.id})
        if reaction:
            post.userReaction = reaction['reactionType']
        
        result.append(post)
    
    return result

# Reaction Routes
@api_router.post("/posts/{post_id}/react")
async def react_to_post(post_id: str, reactionType: dict, current_user: User = Depends(get_current_user)):
    reaction_type = reactionType.get('reactionType')
    
    # Check if already reacted
    existing = await db.reactions.find_one({"postId": post_id, "userId": current_user.id})
    
    if existing:
        if existing['reactionType'] == reaction_type:
            # Remove reaction
            await db.reactions.delete_one({"postId": post_id, "userId": current_user.id})
            await db.posts.update_one({"id": post_id}, {"$inc": {f"reactions.{reaction_type}": -1}})
        else:
            # Change reaction
            await db.reactions.update_one(
                {"postId": post_id, "userId": current_user.id},
                {"$set": {"reactionType": reaction_type}}
            )
            await db.posts.update_one({"id": post_id}, {
                "$inc": {
                    f"reactions.{existing['reactionType']}": -1,
                    f"reactions.{reaction_type}": 1
                }
            })
    else:
        # Add new reaction
        reaction_doc = {
            "id": str(uuid.uuid4()),
            "postId": post_id,
            "userId": current_user.id,
            "reactionType": reaction_type,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        await db.reactions.insert_one(reaction_doc)
        await db.posts.update_one({"id": post_id}, {"$inc": {f"reactions.{reaction_type}": 1}})
    
    return {"success": True}

# Comment Routes
@api_router.post("/posts/{post_id}/comments", response_model=Comment)
async def create_comment(post_id: str, comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
    comment = Comment(**comment_data.model_dump(), postId=post_id, authorId=current_user.id)
    comment_doc = comment.model_dump()
    comment_doc['createdAt'] = comment_doc['createdAt'].isoformat()
    await db.comments.insert_one(comment_doc)
    
    # Update comment count
    await db.posts.update_one({"id": post_id}, {"$inc": {"commentsCount": 1}})
    
    comment.author = current_user
    return comment

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str, current_user: User = Depends(get_current_user)):
    comments = await db.comments.find({"postId": post_id}).sort("createdAt", -1).to_list(100)
    
    result = []
    for comment_doc in comments:
        if isinstance(comment_doc['createdAt'], str):
            comment_doc['createdAt'] = datetime.fromisoformat(comment_doc['createdAt'])
        
        comment = Comment(**comment_doc)
        author_doc = await db.users.find_one({"id": comment.authorId}, {"_id": 0, "password": 0})
        if author_doc:
            comment.author = User(**author_doc)
        result.append(comment)
    
    return result

# Save Post Routes
@api_router.post("/posts/{post_id}/save")
async def save_post(post_id: str, current_user: User = Depends(get_current_user)):
    existing = await db.saved_posts.find_one({"postId": post_id, "userId": current_user.id})
    
    if existing:
        await db.saved_posts.delete_one({"postId": post_id, "userId": current_user.id})
        return {"isSaved": False}
    else:
        save_doc = {
            "id": str(uuid.uuid4()),
            "postId": post_id,
            "userId": current_user.id,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        await db.saved_posts.insert_one(save_doc)
        return {"isSaved": True}

@api_router.get("/saved-posts")
async def get_saved_posts(current_user: User = Depends(get_current_user)):
    saved = await db.saved_posts.find({"userId": current_user.id}).sort("createdAt", -1).to_list(100)
    post_ids = [s['postId'] for s in saved]
    
    posts = await db.posts.find({"id": {"$in": post_ids}}).to_list(100)
    
    result = []
    for post_doc in posts:
        if isinstance(post_doc['createdAt'], str):
            post_doc['createdAt'] = datetime.fromisoformat(post_doc['createdAt'])
        
        post = Post(**post_doc)
        
        if not post.isAnonymous:
            author_doc = await db.users.find_one({"id": post.authorId}, {"_id": 0, "password": 0})
            if author_doc:
                post.author = User(**author_doc)
        
        post.isSaved = True
        result.append(post)
    
    return result

# Story Routes
@api_router.post("/stories", response_model=Story)
async def create_story(story_data: StoryCreate, current_user: User = Depends(get_current_user)):
    story = Story(**story_data.model_dump(), userId=current_user.id)
    story_doc = story.model_dump()
    story_doc['createdAt'] = story_doc['createdAt'].isoformat()
    story_doc['expiresAt'] = story_doc['expiresAt'].isoformat()
    await db.stories.insert_one(story_doc)
    
    story.user = current_user
    return story

@api_router.get("/stories")
async def get_stories(current_user: User = Depends(get_current_user)):
    # Get users that current user follows
    follows = await db.follows.find({"followerId": current_user.id}).to_list(1000)
    following_ids = [f['followingId'] for f in follows]
    following_ids.append(current_user.id)
    
    # Get unexpired stories
    now = datetime.now(timezone.utc)
    stories = await db.stories.find({
        "userId": {"$in": following_ids},
        "expiresAt": {"$gt": now.isoformat()}
    }).sort("createdAt", -1).to_list(100)
    
    result = []
    for story_doc in stories:
        if isinstance(story_doc['createdAt'], str):
            story_doc['createdAt'] = datetime.fromisoformat(story_doc['createdAt'])
        if isinstance(story_doc['expiresAt'], str):
            story_doc['expiresAt'] = datetime.fromisoformat(story_doc['expiresAt'])
        
        story = Story(**story_doc)
        user_doc = await db.users.find_one({"id": story.userId}, {"_id": 0, "password": 0})
        if user_doc:
            story.user = User(**user_doc)
        result.append(story)
    
    return result

# Message Routes
@api_router.post("/messages", response_model=Message)
async def send_message(message_data: MessageCreate, current_user: User = Depends(get_current_user)):
    message = Message(**message_data.model_dump(), senderId=current_user.id)
    message_doc = message.model_dump()
    message_doc['createdAt'] = message_doc['createdAt'].isoformat()
    await db.messages.insert_one(message_doc)
    
    return message

@api_router.get("/messages/{user_id}")
async def get_messages(user_id: str, current_user: User = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"senderId": current_user.id, "receiverId": user_id},
            {"senderId": user_id, "receiverId": current_user.id}
        ]
    }).sort("createdAt", 1).to_list(1000)
    
    result = []
    for msg_doc in messages:
        if isinstance(msg_doc['createdAt'], str):
            msg_doc['createdAt'] = datetime.fromisoformat(msg_doc['createdAt'])
        result.append(Message(**msg_doc))
    
    # Mark messages as read
    await db.messages.update_many(
        {"senderId": user_id, "receiverId": current_user.id, "isRead": False},
        {"$set": {"isRead": True}}
    )
    
    return result

@api_router.get("/conversations")
async def get_conversations(current_user: User = Depends(get_current_user)):
    # Get all users current user has messaged with
    messages = await db.messages.find({
        "$or": [{"senderId": current_user.id}, {"receiverId": current_user.id}]
    }).to_list(10000)
    
    user_ids = set()
    for msg in messages:
        if msg['senderId'] != current_user.id:
            user_ids.add(msg['senderId'])
        if msg['receiverId'] != current_user.id:
            user_ids.add(msg['receiverId'])
    
    conversations = []
    for user_id in user_ids:
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user_doc:
            # Get last message
            last_msg = await db.messages.find_one({
                "$or": [
                    {"senderId": current_user.id, "receiverId": user_id},
                    {"senderId": user_id, "receiverId": current_user.id}
                ]
            }, sort=[("createdAt", -1)])
            
            # Count unread
            unread_count = await db.messages.count_documents({
                "senderId": user_id,
                "receiverId": current_user.id,
                "isRead": False
            })
            
            conversations.append({
                "user": User(**user_doc),
                "lastMessage": last_msg['text'] if last_msg else None,
                "lastMessageTime": last_msg['createdAt'] if last_msg else None,
                "unreadCount": unread_count
            })
    
    return conversations

# Notification Routes
@api_router.get("/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"userId": current_user.id}
    ).sort("createdAt", -1).limit(50).to_list(50)
    
    result = []
    for notif_doc in notifications:
        if isinstance(notif_doc['createdAt'], str):
            notif_doc['createdAt'] = datetime.fromisoformat(notif_doc['createdAt'])
        
        notif = Notification(**notif_doc)
        actor_doc = await db.users.find_one({"id": notif.actorId}, {"_id": 0, "password": 0})
        if actor_doc:
            notif.actor = User(**actor_doc)
        result.append(notif)
    
    return result

@api_router.post("/notifications/read")
async def mark_notifications_read(current_user: User = Depends(get_current_user)):
    await db.notifications.update_many(
        {"userId": current_user.id, "isRead": False},
        {"$set": {"isRead": True}}
    )
    return {"success": True}

# Explore Routes
@api_router.get("/explore")
async def get_explore_posts(current_user: User = Depends(get_current_user)):
    # Get random posts from users current user doesn't follow
    follows = await db.follows.find({"followerId": current_user.id}).to_list(1000)
    following_ids = [f['followingId'] for f in follows]
    following_ids.append(current_user.id)
    
    posts = await db.posts.find({
        "authorId": {"$nin": following_ids}
    }).sort("createdAt", -1).limit(30).to_list(30)
    
    result = []
    for post_doc in posts:
        if isinstance(post_doc['createdAt'], str):
            post_doc['createdAt'] = datetime.fromisoformat(post_doc['createdAt'])
        
        post = Post(**post_doc)
        
        if not post.isAnonymous:
            author_doc = await db.users.find_one({"id": post.authorId}, {"_id": 0, "password": 0})
            if author_doc:
                post.author = User(**author_doc)
        
        result.append(post)
    
    return result

# Reels Routes
@api_router.post("/reels", response_model=Reel)
async def create_reel(reel_data: ReelCreate, current_user: User = Depends(get_current_user)):
    reel = Reel(**reel_data.model_dump(), authorId=current_user.id)
    reel_doc = reel.model_dump()
    reel_doc['createdAt'] = reel_doc['createdAt'].isoformat()
    await db.reels.insert_one(reel_doc)
    
    reel.author = current_user
    return reel

@api_router.get("/reels")
async def get_reels(current_user: User = Depends(get_current_user)):
    reels = await db.reels.find({}).sort("createdAt", -1).limit(50).to_list(50)
    
    result = []
    for reel_doc in reels:
        if isinstance(reel_doc['createdAt'], str):
            reel_doc['createdAt'] = datetime.fromisoformat(reel_doc['createdAt'])
        
        reel = Reel(**reel_doc)
        author_doc = await db.users.find_one({"id": reel.authorId}, {"_id": 0, "password": 0})
        if author_doc:
            reel.author = User(**author_doc)
        
        # Check if liked
        like = await db.reel_likes.find_one({"reelId": reel.id, "userId": current_user.id})
        reel.isLiked = like is not None
        
        result.append(reel)
    
    return result

# Upload Routes
@api_router.post("/upload/image")
async def upload_image(imageData: dict, current_user: User = Depends(get_current_user)):
    try:
        base64_data = imageData.get('imageData', '')
        if not base64_data:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        # For now, just return the base64 data (in production, upload to S3/cloud storage)
        return {"imageUrl": base64_data}
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")


# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
