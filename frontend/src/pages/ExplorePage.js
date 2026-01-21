import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import PostCard from '@/components/PostCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const emotionTags = [
  { label: '🌧️ lonely', value: 'lonely' },
  { label: '🌱 healing', value: 'healing' },
  { label: '🌪️ angry', value: 'angry' },
  { label: '🙏 grateful', value: 'grateful' },
  { label: '🌫️ numb', value: 'numb' },
  { label: '😰 anxious', value: 'anxious' },
  { label: '🤔 thoughtful', value: 'thoughtful' }
];

function ExplorePage({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmotion, setSelectedEmotion] = useState(null);

  useEffect(() => {
    loadExplorePosts();
  }, []);

  const loadExplorePosts = async () => {
    try {
      const response = await axios.get(`${API}/explore`);
      setPosts(response.data);
    } catch (error) {
      toast.error('failed to load explore');
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

  const filteredPosts = selectedEmotion
    ? posts.filter(post => post.mood === selectedEmotion)
    : posts;

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="max-w-4xl mx-auto pb-20 px-4">
        <div className="mb-10 pt-6">
          <h1 
            className="text-3xl font-light text-[#e5e5e5] mb-3"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            discover feelings
          </h1>
          <p className="text-[#9ca3af] font-light">
            find thoughts that resonate with how you feel
          </p>
        </div>

        {/* Emotion Tags */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-3">
            <button
              data-testid="emotion-filter-all"
              onClick={() => setSelectedEmotion(null)}
              className={`px-5 py-2.5 rounded-full font-light slow-transition ${
                selectedEmotion === null
                  ? 'bg-[#B4A7D6] text-[#1a1d28]'
                  : 'glass-card text-[#9ca3af] hover:text-[#e5e5e5] hover:border-[#B4A7D6]/30'
              }`}
            >
              all feelings
            </button>
            {emotionTags.map((emotion) => (
              <button
                key={emotion.value}
                data-testid={`emotion-filter-${emotion.value}`}
                onClick={() => setSelectedEmotion(emotion.value)}
                className={`px-5 py-2.5 rounded-full font-light slow-transition ${
                  selectedEmotion === emotion.value
                    ? 'bg-[#B4A7D6] text-[#1a1d28]'
                    : 'glass-card text-[#9ca3af] hover:text-[#e5e5e5] hover:border-[#B4A7D6]/30'
                }`}
              >
                {emotion.label}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-2 border-[#B4A7D6]/30 border-t-[#B4A7D6] rounded-full animate-spin mx-auto"></div>
            <p className="text-[#9ca3af] mt-4 font-light">discovering...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <p className="text-[#9ca3af] text-lg font-light">
              {selectedEmotion ? `no "${selectedEmotion}" posts yet` : 'no posts to explore'}
            </p>
            <p className="text-[#6b7280] text-sm mt-2 font-light">
              check back later for new thoughts
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {filteredPosts.map(post => (
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

export default ExplorePage;
