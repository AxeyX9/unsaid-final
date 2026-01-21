import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Settings, UserPlus, UserMinus, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import PostCard from '@/components/PostCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ProfilePage({ user: currentUser, onLogout }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = userId === currentUser.id;
  
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: '',
    avatar: '',
    isPrivate: false
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const [userRes, postsRes] = await Promise.all([
        axios.get(`${API}/users/${userId}`),
        axios.get(`${API}/users/${userId}/posts`)
      ]);
      setUser(userRes.data);
      setPosts(postsRes.data);
      
      if (isOwnProfile) {
        setProfileForm({
          bio: userRes.data.bio || '',
          avatar: userRes.data.avatar || '',
          isPrivate: userRes.data.isPrivate || false
        });
      } else {
        // Check if following
        const followingRes = await axios.get(`${API}/users/${currentUser.id}/following`);
        setIsFollowing(followingRes.data.some(u => u.id === userId));
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await axios.post(`${API}/users/${userId}/unfollow`);
        setIsFollowing(false);
        toast.success('Unfollowed');
      } else {
        const response = await axios.post(`${API}/users/${userId}/follow`);
        setIsFollowing(true);
        toast.success(response.data.status === 'pending' ? 'Follow request sent' : 'Following');
      }
    } catch (error) {
      toast.error('Failed to follow/unfollow');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API}/users/me`, profileForm);
      setUser(response.data);
      setShowSettings(false);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      await axios.post(`${API}/posts/${postId}/react`, { reactionType });
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const newReactions = { ...post.reactions };
          if (post.userReaction) {
            newReactions[post.userReaction] = Math.max(0, newReactions[post.userReaction] - 1);
          }
          if (post.userReaction === reactionType) {
            return { ...post, reactions: newReactions, userReaction: null };
          } else {
            newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
            return { ...post, reactions: newReactions, userReaction: reactionType };
          }
        }
        return post;
      }));
    } catch (error) {
      toast.error('Failed to react');
    }
  };

  const handleSavePost = async (postId) => {
    try {
      const response = await axios.post(`${API}/posts/${postId}/save`);
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, isSaved: response.data.isSaved } : post
      ));
      toast.success(response.data.isSaved ? 'Post saved' : 'Post unsaved');
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-moonlight">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-void/80 border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            data-testid="back-btn"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:text-moonlight"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {isOwnProfile && (
            <Button
              data-testid="settings-btn"
              variant="ghost"
              onClick={() => setShowSettings(true)}
              className="text-white hover:text-moonlight"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {/* Profile Info */}
        <div className="space-y-6 mb-12" data-testid="profile-info">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-zinc-800 text-white text-3xl">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="font-playfair text-2xl font-bold text-white" data-testid="profile-display-name">
                  {user.displayName}
                </h2>
                <p className="text-zinc-400 text-sm" data-testid="profile-username">@{user.username}</p>
              </div>
              
              {!isOwnProfile && (
                <Button
                  data-testid="follow-btn"
                  onClick={handleFollow}
                  className={`${
                    isFollowing
                      ? 'bg-zinc-800 hover:bg-zinc-700'
                      : 'bg-moonlight hover:bg-moonlight-hover'
                  } text-white rounded-full px-6 py-2`}
                >
                  {isFollowing ? (
                    <><UserMinus className="w-4 h-4 mr-2" /> Unfollow</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" /> Follow</>
                  )}
                </Button>
              )}
            </div>
          </div>

          {user.bio && (
            <p className="text-zinc-300 text-base leading-relaxed" data-testid="profile-bio">{user.bio}</p>
          )}

          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-white font-semibold text-lg" data-testid="profile-posts-count">{posts.length}</div>
              <div className="text-zinc-500 text-sm">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold text-lg" data-testid="profile-followers-count">{user.followersCount}</div>
              <div className="text-zinc-500 text-sm">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold text-lg" data-testid="profile-following-count">{user.followingCount}</div>
              <div className="text-zinc-500 text-sm">Following</div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Grid3x3 className="w-5 h-5" />
            <span className="text-sm font-medium">Posts</span>
          </div>
          
          {posts.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No posts yet
            </div>
          ) : (
            <div className="space-y-8" data-testid="profile-posts-list">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onReaction={handleReaction}
                  onSave={handleSavePost}
                  onUserClick={(userId) => navigate(`/profile/${userId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-obsidian border-white/10 text-white max-w-md" data-testid="settings-modal">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl">Edit Profile</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateProfile} className="space-y-6 pt-2">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileForm.avatar} />
                <AvatarFallback className="bg-zinc-800 text-white text-3xl">
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Label htmlFor="avatar-upload" className="cursor-pointer text-moonlight hover:text-moonlight-hover transition-colors">
                Change Avatar
              </Label>
              <input
                id="avatar-upload"
                data-testid="avatar-upload-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-zinc-300">Bio</Label>
              <Textarea
                id="bio"
                data-testid="bio-input"
                placeholder="Tell us about yourself..."
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="bg-zinc-900/50 border-transparent focus:border-moonlight/50 rounded-xl text-white placeholder:text-zinc-600 min-h-[100px] resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="private" className="text-zinc-300">Private Account</Label>
              <Switch
                id="private"
                data-testid="private-toggle"
                checked={profileForm.isPrivate}
                onCheckedChange={(checked) => setProfileForm({ ...profileForm, isPrivate: checked })}
              />
            </div>

            <Button
              data-testid="save-profile-btn"
              type="submit"
              className="w-full bg-moonlight hover:bg-moonlight-hover text-white rounded-full py-6 text-base font-medium"
            >
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProfilePage;