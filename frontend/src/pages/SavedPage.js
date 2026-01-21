import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Bookmark } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import PostCard from '@/components/PostCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function SavedPage({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    try {
      const response = await axios.get(`${API}/saved-posts`);
      setPosts(response.data);
    } catch (error) {
      toast.error('failed to load saved posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    if (!updatedPost.isSaved) {
      setPosts(posts.filter(p => p.id !== updatedPost.id));
    } else {
      setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    }
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="max-w-3xl mx-auto pb-20 px-4">
        <div className="mb-10 pt-6">
          <h1 
            className="text-3xl font-light text-[#e5e5e5] mb-2"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            saved thoughts
          </h1>
          <p className="text-[#9ca3af] font-light">
            keep what matters close
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-2 border-[#B4A7D6]/30 border-t-[#B4A7D6] rounded-full animate-spin mx-auto"></div>
            <p className="text-[#9ca3af] mt-4 font-light">loading...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <Bookmark className="w-12 h-12 text-[#9ca3af] mx-auto mb-4" />
            <p className="text-[#9ca3af] text-lg font-light">no saved posts yet</p>
            <p className="text-[#6b7280] text-sm mt-2 font-light">
              bookmark posts you want to revisit later
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map(post => (
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
