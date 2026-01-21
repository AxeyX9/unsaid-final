import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Trash2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const reactions = [
  { type: 'black_heart', emoji: '🖤', label: 'resonate' },
  { type: 'white_heart', emoji: '🤍', label: 'felt this' },
  { type: 'hug', emoji: '🫂', label: 'hugs' },
  { type: 'moon', emoji: '🌙', label: 'calm' }
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
      toast.error('failed to load comments');
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      await axios.post(`${API}/posts/${post.id}/react`, { reactionType });
      
      const updatedPost = { ...localPost };
      const currentReaction = localPost.userReaction;
      
      if (currentReaction === reactionType) {
        updatedPost.reactions[reactionType]--;
        updatedPost.userReaction = null;
      } else {
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
      toast.error('failed to react');
    }
  };

  const handleSave = async () => {
    try {
      const response = await axios.post(`${API}/posts/${post.id}/save`);
      const updatedPost = { ...localPost, isSaved: response.data.isSaved };
      setLocalPost(updatedPost);
      onUpdate(updatedPost);
      toast.success(response.data.isSaved ? 'saved' : 'unsaved');
    } catch (error) {
      toast.error('failed to save');
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
      
      const updatedPost = { ...localPost, commentsCount: localPost.commentsCount + 1 };
      setLocalPost(updatedPost);
      onUpdate(updatedPost);
      toast.success('comment added');
    } catch (error) {
      toast.error('failed to add comment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('delete this post?')) return;
    
    try {
      await axios.delete(`${API}/posts/${post.id}`);
      onDelete(post.id);
      toast.success('post deleted');
    } catch (error) {
      toast.error('failed to delete');
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
      anxious: '😰',
      lonely: '🌧️',
      healing: '🌱',
      angry: '🌪️',
      numb: '🌫️'
    };
    return moods[mood] || '';
  };

  const totalReactions = Object.values(localPost.reactions || {}).reduce((a, b) => a + b, 0);
  const isAnonymous = localPost.isAnonymous;
  const author = isAnonymous ? { displayName: 'anonymous', username: 'anonymous', avatar: null } : localPost.author;

  return (
    <div 
      data-testid={`post-card-${post.id}`}
      className="glass-card rounded-2xl overflow-hidden calm-shadow slow-transition hover:border-[#B4A7D6]/20 animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => !isAnonymous && navigate(`/profile/${author?.id}`)}
        >
          {isAnonymous ? (
            <div className="w-11 h-11 rounded-full bg-[#B4A7D6]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[#B4A7D6]/50" />
            </div>
          ) : (
            <img
              src={author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.username}`}
              alt={author?.displayName}
              className="w-11 h-11 rounded-full border border-[#B4A7D6]/20"
            />
          )}
          <div>
            <div className="font-medium text-[#e5e5e5] group-hover:text-[#B4A7D6] slow-transition">
              {author?.displayName}
            </div>
            <div className="text-xs text-[#9ca3af] font-light">
              {formatDistanceToNow(new Date(localPost.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        {currentUser.id === localPost.authorId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                data-testid={`post-menu-${post.id}`}
                className="p-2 hover:bg-[#B4A7D6]/10 rounded-lg slow-transition"
              >
                <MoreHorizontal className="w-5 h-5 text-[#9ca3af]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#212530] border-[#B4A7D6]/10 glass-card">
              <DropdownMenuItem 
                onClick={handleDelete} 
                data-testid={`delete-post-${post.id}`}
                className="text-red-400 cursor-pointer hover:bg-red-400/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                delete post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="px-6 pb-4">
        {localPost.mood && (
          <div className="text-sm text-[#B4A7D6]/70 mb-3 font-light flex items-center space-x-2">
            <span>{getMoodEmoji(localPost.mood)}</span>
            <span>feeling {localPost.mood}</span>
          </div>
        )}
        <p className="text-[#e5e5e5] whitespace-pre-wrap break-words leading-relaxed font-light">
          {localPost.text}
        </p>
        
        {localPost.text.match(/#\w+/g) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {localPost.text.match(/#\w+/g).map((tag, i) => (
              <span 
                key={i} 
                className="text-[#B4A7D6] hover:text-[#a294c4] cursor-pointer text-sm slow-transition"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {localPost.imageUrl && (
        <div className="px-6 pb-4">
          <img
            src={localPost.imageUrl}
            alt="Post"
            className="w-full max-h-[500px] object-cover rounded-xl"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 space-y-3 border-t border-[#B4A7D6]/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <button
                data-testid={`react-button-${post.id}`}
                onClick={() => setShowReactions(!showReactions)}
                onMouseEnter={() => setShowReactions(true)}
                className="flex items-center space-x-2 text-[#9ca3af] hover:text-[#B4A7D6] slow-transition"
              >
                <Heart
                  className={`w-5 h-5 ${localPost.userReaction ? 'fill-[#B4A7D6] text-[#B4A7D6]' : ''}`}
                />
                {totalReactions > 0 && (
                  <span className="text-sm font-light">{totalReactions}</span>
                )}
              </button>

              {showReactions && (
                <div
                  className="absolute bottom-full left-0 mb-3 flex space-x-3 glass-card rounded-full px-4 py-3 calm-shadow z-10 animate-slide-up"
                  onMouseLeave={() => setShowReactions(false)}
                >
                  {reactions.map(reaction => (
                    <button
                      key={reaction.type}
                      data-testid={`reaction-${reaction.type}-${post.id}`}
                      onClick={() => handleReaction(reaction.type)}
                      className="text-2xl hover:scale-125 slow-transition"
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
                data-testid={`comment-button-${post.id}`}
                onClick={handleShowComments}
                className="flex items-center space-x-2 text-[#9ca3af] hover:text-[#B4A7D6] slow-transition"
              >
                <MessageCircle className="w-5 h-5" />
                {localPost.commentsCount > 0 && (
                  <span className="text-sm font-light">{localPost.commentsCount}</span>
                )}
              </button>
            )}
          </div>

          <button 
            data-testid={`save-button-${post.id}`}
            onClick={handleSave} 
            className="text-[#9ca3af] hover:text-[#B4A7D6] slow-transition"
          >
            <Bookmark className={`w-5 h-5 ${localPost.isSaved ? 'fill-[#B4A7D6] text-[#B4A7D6]' : ''}`} />
          </button>
        </div>

        {/* Reactions Summary */}
        {totalReactions > 0 && (
          <div className="flex items-center space-x-3 text-sm text-[#9ca3af]">
            {Object.entries(localPost.reactions).map(([type, count]) => {
              if (count === 0) return null;
              const reaction = reactions.find(r => r.type === type);
              return (
                <span key={type} className="flex items-center space-x-1.5">
                  <span>{reaction?.emoji}</span>
                  <span className="font-light">{count}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="bg-[#212530] border-[#B4A7D6]/10 text-[#e5e5e5] max-w-2xl glass-card calm-shadow max-h-[80vh] overflow-y-auto">
          <div className="space-y-6">
            <h3 className="text-xl font-light" style={{ fontFamily: 'Manrope, sans-serif' }}>
              thoughts
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleComment} className="space-y-3">
              <Textarea
                data-testid={`comment-input-${post.id}`}
                placeholder="share your thoughts..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-[#2a2f3f]/30 border-[#B4A7D6]/10 text-[#e5e5e5] placeholder:text-[#6b7280] resize-none min-h-[80px] slow-transition focus:border-[#B4A7D6]/30"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  data-testid={`comment-submit-${post.id}`}
                  disabled={!commentText.trim()}
                  className="bg-[#B4A7D6] hover:bg-[#a294c4] text-[#1a1d28] slow-transition"
                >
                  add thought
                </Button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-[#9ca3af] py-8 font-light">no thoughts yet...</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex space-x-3 animate-fade-in">
                    <img
                      src={comment.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.username}`}
                      alt={comment.author?.displayName}
                      className="w-9 h-9 rounded-full border border-[#B4A7D6]/20"
                    />
                    <div className="flex-1">
                      <div className="glass-card rounded-xl p-4">
                        <div className="font-medium text-sm text-[#e5e5e5]">{comment.author?.displayName}</div>
                        <p className="text-sm text-[#9ca3af] mt-1.5 leading-relaxed font-light">{comment.text}</p>
                      </div>
                      <div className="text-xs text-[#6b7280] mt-1.5 px-4 font-light">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PostCard;
