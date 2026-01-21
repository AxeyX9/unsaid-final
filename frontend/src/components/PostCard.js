import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const reactions = [
  { type: 'black_heart', emoji: '❤️', label: 'Love' },
  { type: 'white_heart', emoji: '🤍', label: 'Like' },
  { type: 'hug', emoji: '🤗', label: 'Hug' },
  { type: 'moon', emoji: '🌙', label: 'Moon' }
];

function PostCard({ post, currentUser, onUpdate, onDelete }) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  const loadComments = async () => {
    try {
      const response = await axios.get(`${API}/posts/${post.id}/comments`);
      setComments(response.data);
    } catch (error) {
      toast.error('Failed to load comments');
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      await axios.post(`${API}/posts/${post.id}/react`, { reactionType });
      
      // Update local state
      const updatedPost = { ...localPost };
      const currentReaction = localPost.userReaction;
      
      if (currentReaction === reactionType) {
        // Remove reaction
        updatedPost.reactions[reactionType]--;
        updatedPost.userReaction = null;
      } else {
        // Add or change reaction
        if (currentReaction) {
          updatedPost.reactions[currentReaction]--;
        }
        updatedPost.reactions[reactionType]++;
        updatedPost.userReaction = reactionType;
      }
      
      setLocalPost(updatedPost);
      onUpdate(updatedPost);
      setShowReactions(false);
    } catch (error) {
      toast.error('Failed to react');
    }
  };

  const handleSave = async () => {
    try {
      const response = await axios.post(`${API}/posts/${post.id}/save`);
      const updatedPost = { ...localPost, isSaved: response.data.isSaved };
      setLocalPost(updatedPost);
      onUpdate(updatedPost);
      toast.success(response.data.isSaved ? 'Post saved' : 'Post unsaved');
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const response = await axios.post(`${API}/posts/${post.id}/comments`, {
        text: commentText
      });
      setComments([response.data, ...comments]);
      setCommentText('');
      
      // Update comment count
      const updatedPost = { ...localPost, commentsCount: localPost.commentsCount + 1 };
      setLocalPost(updatedPost);
      onUpdate(updatedPost);
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axios.delete(`${API}/posts/${post.id}`);
      onDelete(post.id);
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleShowComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const getMoodEmoji = (mood) => {
    const moods = {
      happy: '😊',
      sad: '😢',
      excited: '🎉',
      thoughtful: '🤔',
      grateful: '🙏',
      anxious: '😰'
    };
    return moods[mood] || '';
  };

  const totalReactions = Object.values(localPost.reactions || {}).reduce((a, b) => a + b, 0);
  const isAnonymous = localPost.isAnonymous;
  const author = isAnonymous ? { displayName: 'Anonymous', username: 'anonymous', avatar: null } : localPost.author;

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => !isAnonymous && navigate(`/profile/${author?.id}`)}
        >
          <img
            src={author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.username}`}
            alt={author?.displayName}
            className="w-10 h-10 rounded-full border-2 border-purple-500"
          />
          <div>
            <div className="font-medium">{author?.displayName}</div>
            <div className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(localPost.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        {currentUser.id === localPost.authorId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a1a1a] border-white/10">
              <DropdownMenuItem onClick={handleDelete} className="text-red-400 cursor-pointer">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {localPost.mood && (
          <div className="text-sm text-gray-400 mb-2">
            Feeling {getMoodEmoji(localPost.mood)} {localPost.mood}
          </div>
        )}
        <p className="text-white whitespace-pre-wrap break-words">{localPost.text}</p>
        
        {/* Extract and display hashtags */}
        {localPost.text.match(/#\w+/g) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {localPost.text.match(/#\w+/g).map((tag, i) => (
              <span key={i} className="text-purple-400 hover:underline cursor-pointer text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {localPost.imageUrl && (
        <img
          src={localPost.imageUrl}
          alt="Post"
          className="w-full max-h-[600px] object-cover"
        />
      )}

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                onMouseEnter={() => setShowReactions(true)}
                className="flex items-center space-x-1 hover:text-pink-500 transition-colors"
              >
                <Heart
                  className={`w-6 h-6 ${localPost.userReaction ? 'fill-pink-500 text-pink-500' : ''}`}
                />
                {totalReactions > 0 && (
                  <span className="text-sm">{totalReactions}</span>
                )}
              </button>

              {showReactions && (
                <div
                  className="absolute bottom-full left-0 mb-2 flex space-x-2 bg-[#2a2a2a] rounded-full px-3 py-2 border border-white/10 shadow-xl z-10"
                  onMouseLeave={() => setShowReactions(false)}
                >
                  {reactions.map(reaction => (
                    <button
                      key={reaction.type}
                      onClick={() => handleReaction(reaction.type)}
                      className="text-2xl hover:scale-125 transition-transform"
                      title={reaction.label}
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {localPost.commentsEnabled && (
              <button
                onClick={handleShowComments}
                className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
                {localPost.commentsCount > 0 && (
                  <span className="text-sm">{localPost.commentsCount}</span>
                )}
              </button>
            )}

            <button className="hover:text-green-500 transition-colors">
              <Send className="w-6 h-6" />
            </button>
          </div>

          <button onClick={handleSave} className="hover:text-yellow-500 transition-colors">
            <Bookmark className={`w-6 h-6 ${localPost.isSaved ? 'fill-yellow-500 text-yellow-500' : ''}`} />
          </button>
        </div>

        {/* Reactions Summary */}
        {totalReactions > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            {Object.entries(localPost.reactions).map(([type, count]) => {
              if (count === 0) return null;
              const reaction = reactions.find(r => r.type === type);
              return (
                <span key={type} className="flex items-center space-x-1">
                  <span>{reaction?.emoji}</span>
                  <span>{count}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Comments Section */}
      {showComments && localPost.commentsEnabled && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* Comment Form */}
          <form onSubmit={handleComment} className="flex space-x-2">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="bg-white/5 border-white/10 text-white resize-none h-10"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!commentText.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Post
            </Button>
          </form>

          {/* Comments List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {comments.map(comment => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.username}`}
                  alt={comment.author?.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="font-medium text-sm">{comment.author?.displayName}</div>
                    <p className="text-sm text-gray-300 mt-1">{comment.text}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 px-3">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PostCard;
