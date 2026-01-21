import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useInView } from 'react-intersection-observer';
import { Plus, X, Image as ImageIcon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/components/AppLayout';
import PostCard from '@/components/PostCard';
// Stories removed - doesn't fit unsaid philosophy

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const moods = [
  { value: 'lonely', label: '🌧️ lonely', emoji: '🌧️' },
  { value: 'healing', label: '🌱 healing', emoji: '🌱' },
  { value: 'angry', label: '🌪️ angry', emoji: '🌪️' },
  { value: 'grateful', label: '🙏 grateful', emoji: '🙏' },
  { value: 'anxious', label: '😰 anxious', emoji: '😰' },
  { value: 'numb', label: '🌫️ numb', emoji: '🌫️' },
  { value: 'thoughtful', label: '🤔 thoughtful', emoji: '🤔' },
  { value: 'sad', label: '😢 sad', emoji: '😢' }
];

function HomePage({ user, onLogout }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postForm, setPostForm] = useState({
    text: '',
    imageUrl: '',
    mood: '',
    commentsEnabled: true,
    isAnonymous: false
  });
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { ref: loadMoreRef, inView } = useInView();

  const loadPosts = async (offset = 0) => {
    try {
      const response = await axios.get(`${API}/feed?skip=${offset}&limit=10`);
      if (response.data.length < 10) {
        setHasMore(false);
      }
      if (offset === 0) {
        setPosts(response.data);
      } else {
        setPosts(prev => [...prev, ...response.data]);
      }
    } catch (error) {
      toast.error('failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(0);
  }, []);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      const newSkip = skip + 10;
      setSkip(newSkip);
      loadPosts(newSkip);
    }
  }, [inView]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postForm.text.trim() && !postForm.imageUrl) {
      toast.error('post cannot be empty');
      return;
    }

    try {
      const response = await axios.post(`${API}/posts`, postForm);
      setPosts([response.data, ...posts]);
      setPostForm({
        text: '',
        imageUrl: '',
        mood: '',
        commentsEnabled: true,
        isAnonymous: false
      });
      setImagePreview('');
      setShowCreatePost(false);
      toast.success('your thought is shared');
    } catch (error) {
      toast.error('failed to create post');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('file size must be less than 10mb');
        return;
      }

      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result;
          setImagePreview(base64);
          
          const response = await axios.post(`${API}/upload/image`, {
            imageData: base64
          });
          
          setPostForm({ ...postForm, imageUrl: response.data.imageUrl });
          toast.success('image uploaded');
        } catch (error) {
          toast.error('failed to upload image');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="max-w-2xl mx-auto pb-20 px-4">
        {/* Welcome message */}
        <div className="mb-8 text-center pt-6">
          <h1 className="text-3xl font-light text-[#e5e5e5] mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            your space
          </h1>
          <p className="text-[#9ca3af] font-light text-sm">
            say it... even if it's messy
          </p>
        </div>

        {/* Create Post Button */}
        <div className="glass-card rounded-2xl p-5 mb-8 slow-transition hover:border-[#B4A7D6]/20">
          <button
            data-testid="create-post-trigger"
            onClick={() => setShowCreatePost(true)}
            className="w-full flex items-center space-x-4 px-5 py-4 bg-[#2a2f3f]/30 hover:bg-[#2a2f3f]/50 rounded-xl slow-transition"
          >
            {postForm.isAnonymous ? (
              <div className="w-11 h-11 rounded-full bg-[#B4A7D6]/10 flex items-center justify-center">
                <User className="w-5 h-5 text-[#B4A7D6]/50" />
              </div>
            ) : (
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt={user.displayName}
                className="w-11 h-11 rounded-full border border-[#B4A7D6]/20"
              />
            )}
            <span className="text-[#9ca3af] flex-1 text-left font-light">
              what's on your mind?
            </span>
            <Plus className="w-5 h-5 text-[#B4A7D6]" />
          </button>
        </div>

        {/* Feed */}
        <div className="space-y-8">
          {loading && posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-2 border-[#B4A7D6]/30 border-t-[#B4A7D6] rounded-full animate-spin mx-auto"></div>
              <p className="text-[#9ca3af] mt-4 font-light">loading thoughts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <p className="text-[#9ca3af] text-lg font-light">no posts yet</p>
              <p className="text-[#6b7280] text-sm mt-2 font-light">
                follow people to see their thoughts
              </p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            ))
          )}

          {hasMore && !loading && posts.length > 0 && (
            <div ref={loadMoreRef} className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#B4A7D6]/30 border-t-[#B4A7D6] rounded-full animate-spin mx-auto"></div>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="bg-[#212530] border-[#B4A7D6]/10 text-[#e5e5e5] max-w-2xl glass-card calm-shadow">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-light mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                share a thought
              </h2>
              <p className="text-sm text-[#9ca3af] font-light">
                no pressure, no judgment
              </p>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-5">
              <Textarea
                data-testid="post-text-input"
                placeholder="say it... even if it's messy"
                value={postForm.text}
                onChange={(e) => setPostForm({ ...postForm, text: e.target.value })}
                className="bg-[#2a2f3f]/30 border-[#B4A7D6]/10 text-[#e5e5e5] placeholder:text-[#6b7280] min-h-[150px] resize-none slow-transition focus:border-[#B4A7D6]/30 text-base leading-relaxed"
              />

              {imagePreview && (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full rounded-xl" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setPostForm({ ...postForm, imageUrl: '' });
                    }}
                    className="absolute top-3 right-3 p-2 bg-[#1a1d28]/80 rounded-full hover:bg-[#1a1d28] slow-transition"
                  >
                    <X className="w-4 h-4 text-[#e5e5e5]" />
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="text-[#e5e5e5] font-light text-sm mb-2 block">
                    how are you feeling? (optional)
                  </Label>
                  <Select 
                    value={postForm.mood} 
                    onValueChange={(value) => setPostForm({ ...postForm, mood: value })}
                  >
                    <SelectTrigger 
                      data-testid="mood-selector"
                      className="bg-[#2a2f3f]/30 border-[#B4A7D6]/10 text-[#e5e5e5] slow-transition h-11"
                    >
                      <SelectValue placeholder="select a mood" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#212530] border-[#B4A7D6]/10 glass-card">
                      {moods.map(mood => (
                        <SelectItem 
                          key={mood.value} 
                          value={mood.value}
                          className="hover:bg-[#B4A7D6]/10 cursor-pointer"
                        >
                          {mood.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className="flex items-center space-x-2 px-4 py-2.5 bg-[#2a2f3f]/30 hover:bg-[#2a2f3f]/50 rounded-lg slow-transition">
                      <ImageIcon className="w-5 h-5 text-[#B4A7D6]" />
                      <span className="text-sm font-light text-[#e5e5e5]">
                        {uploading ? 'uploading...' : 'add image'}
                      </span>
                    </div>
                  </label>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        data-testid="comments-toggle"
                        checked={postForm.commentsEnabled}
                        onCheckedChange={(checked) => setPostForm({ ...postForm, commentsEnabled: checked })}
                        className="data-[state=checked]:bg-[#B4A7D6]"
                      />
                      <Label className="text-sm font-light text-[#9ca3af]">
                        allow thoughts
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        data-testid="anonymous-toggle"
                        checked={postForm.isAnonymous}
                        onCheckedChange={(checked) => setPostForm({ ...postForm, isAnonymous: checked })}
                        className="data-[state=checked]:bg-[#B4A7D6]"
                      />
                      <Label className="text-sm font-light text-[#9ca3af]">
                        post anonymously
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreatePost(false)}
                  className="border-[#B4A7D6]/20 text-[#e5e5e5] hover:bg-[#B4A7D6]/10 slow-transition"
                >
                  cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="post-submit"
                  disabled={uploading || (!postForm.text.trim() && !postForm.imageUrl)}
                  className="bg-[#B4A7D6] hover:bg-[#a294c4] text-[#1a1d28] slow-transition"
                >
                  share thought
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export default HomePage;
