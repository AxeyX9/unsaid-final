import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import PostCard from '@/components/PostCard';
import { Bookmark } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function SavedPage({ user, onLogout }) {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    try {
      const response = await axios.get(`${API}/saved/posts`);
      setSavedPosts(response.data);
    } catch (error) {
      toast.error('Failed to load saved posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setSavedPosts(savedPosts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setSavedPosts(savedPosts.filter(p => p.id !== postId));
  };

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="max-w-2xl mx-auto pb-20">
        <div className="flex items-center space-x-3 mb-6">
          <Bookmark className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold">Saved Posts</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading saved posts...</p>
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-white/10">
            <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">No saved posts yet</p>
            <p className="text-gray-500 text-sm mt-2">Save posts to view them later</p>
          </div>
        ) : (
          <div className="space-y-6">
            {savedPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default SavedPage;
