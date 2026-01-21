import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useInView } from 'react-intersection-observer';
import { Plus, X, Image as ImageIcon, Video, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/components/AppLayout';
import StoriesBar from '@/components/StoriesBar';
import PostCard from '@/components/PostCard';
import CreateStoryDialog from '@/components/CreateStoryDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const moods = [
  { value: 'happy', label: '😊 Happy', emoji: '😊' },
  { value: 'sad', label: '😢 Sad', emoji: '😢' },
  { value: 'excited', label: '🎉 Excited', emoji: '🎉' },
  { value: 'thoughtful', label: '🤔 Thoughtful', emoji: '🤔' },
  { value: 'grateful', label: '🙏 Grateful', emoji: '🙏' },
  { value: 'anxious', label: '😰 Anxious', emoji: '😰' }
];

function HomePage({ user, onLogout }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
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
      toast.error('Failed to load posts');
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
      toast.error('Post cannot be empty');
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
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result;
          setImagePreview(base64);
          
          // Upload to backend
          const response = await axios.post(`${API}/upload/image`, {
            imageData: base64
          });
          
          setPostForm({ ...postForm, imageUrl: response.data.imageUrl });
          toast.success('Image uploaded!');
        } catch (error) {
          toast.error('Failed to upload image');
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
      <div className="max-w-2xl mx-auto pb-20">
        {/* Stories Bar */}
        <StoriesBar user={user} onCreateStory={() => setShowCreateStory(true)} />

        {/* Create Post Button */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6 border border-white/10">
          <button
            onClick={() => setShowCreatePost(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt={user.displayName}
              className="w-10 h-10 rounded-full"
            />
            <span className="text-gray-400 flex-1 text-left">What's on your mind?</span>
            <Plus className="w-5 h-5 text-purple-400" />
          </button>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {loading && posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-white/10">
              <p className="text-gray-400 text-lg">No posts yet</p>
              <p className="text-gray-500 text-sm mt-2">Follow people to see their posts here</p>
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

          {hasMore && !loading && (
            <div ref={loadMoreRef} className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={postForm.text}
              onChange={(e) => setPostForm({ ...postForm, text: e.target.value })}
              className="bg-white/5 border-white/10 text-white min-h-[120px] resize-none"
            />

            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full rounded-lg" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setPostForm({ ...postForm, imageUrl: '' });
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mood (optional)</Label>
                <Select value={postForm.mood} onValueChange={(value) => setPostForm({ ...postForm, mood: value })}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {moods.map(mood => (
                      <SelectItem key={mood.value} value={mood.value}>{mood.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <ImageIcon className="w-5 h-5 text-purple-400" />
                    <span className="text-sm">{uploading ? 'Uploading...' : 'Photo'}</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={postForm.commentsEnabled}
                    onCheckedChange={(checked) => setPostForm({ ...postForm, commentsEnabled: checked })}
                  />
                  <Label className="text-sm">Comments</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={postForm.isAnonymous}
                    onCheckedChange={(checked) => setPostForm({ ...postForm, isAnonymous: checked })}
                  />
                  <Label className="text-sm">Anonymous</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreatePost(false)}
                className="border-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Post
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Story Dialog */}
      <CreateStoryDialog
        open={showCreateStory}
        onOpenChange={setShowCreateStory}
        user={user}
      />
    </AppLayout>
  );
}

export default HomePage;
