import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import PostCard from '@/components/PostCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ExplorePage({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExplorePosts();
  }, []);

  const loadExplorePosts = async () => {
    try {
      const response = await axios.get(`${API}/explore/posts`);
      setPosts(response.data);
    } catch (error) {
      toast.error('Failed to load explore posts');
    } finally {
      setLoading(false);
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
      <div className="max-w-5xl mx-auto pb-20">
        <h1 className="text-3xl font-bold mb-6">Explore</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading explore feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-white/10">
            <p className="text-gray-400 text-lg">No posts to explore</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 mb-8">
            {posts.map(post => (
              <div
                key={post.id}
                className="aspect-square cursor-pointer group relative overflow-hidden bg-[#1a1a1a]"
              >
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center p-4">
                    <p className="text-sm text-center line-clamp-6">{post.text}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="font-medium text-lg">
                      {Object.values(post.reactions || {}).reduce((a, b) => a + b, 0)} reactions
                    </div>
                    <div className="text-sm text-white/70">
                      {post.commentsCount} comments
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default ExplorePage;
