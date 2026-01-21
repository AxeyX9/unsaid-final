import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, MessageCircle, Share2, Music, Play, Pause } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { formatDistanceToNow } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ReelCard({ reel, currentUser }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localReel, setLocalReel] = useState(reel);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleReaction = async () => {
    try {
      await axios.post(`${API}/posts/${reel.id}/react`, { reactionType: 'black_heart' });
      
      const updatedReel = { ...localReel };
      if (localReel.userReaction) {
        updatedReel.reactions.black_heart--;
        updatedReel.userReaction = null;
      } else {
        updatedReel.reactions.black_heart++;
        updatedReel.userReaction = 'black_heart';
      }
      setLocalReel(updatedReel);
    } catch (error) {
      toast.error('Failed to react');
    }
  };

  const totalReactions = Object.values(localReel.reactions || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="h-screen snap-start relative flex items-center justify-center bg-black">
      {/* Video/Image */}
      {reel.videoUrl ? (
        <video
          ref={videoRef}
          src={reel.videoUrl}
          className="max-h-full max-w-full object-contain"
          loop
          onClick={togglePlay}
        />
      ) : reel.imageUrl ? (
        <img
          src={reel.imageUrl}
          alt="Reel"
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900 p-12">
          <p className="text-white text-2xl text-center">{reel.text}</p>
        </div>
      )}

      {/* Play/Pause overlay */}
      {reel.videoUrl && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
        >
          {isPlaying ? (
            <Pause className="w-20 h-20 text-white" />
          ) : (
            <Play className="w-20 h-20 text-white" />
          )}
        </button>
      )}

      {/* Author Info */}
      <div className="absolute bottom-20 left-6 right-20 text-white">
        <div className="flex items-center space-x-3 mb-3">
          <img
            src={reel.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.author?.username}`}
            alt={reel.author?.displayName}
            className="w-12 h-12 rounded-full border-2 border-white"
          />
          <div>
            <div className="font-medium">{reel.author?.displayName}</div>
            <div className="text-sm text-white/70">@{reel.author?.username}</div>
          </div>
        </div>
        
        {reel.text && (
          <p className="text-sm mb-2">{reel.text}</p>
        )}
        
        {reel.mood && (
          <div className="flex items-center space-x-2 text-sm">
            <Music className="w-4 h-4" />
            <span>Feeling {reel.mood}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="absolute right-6 bottom-20 flex flex-col items-center space-y-6">
        <button
          onClick={handleReaction}
          className="flex flex-col items-center group"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Heart
              className={`w-6 h-6 ${localReel.userReaction ? 'fill-pink-500 text-pink-500' : 'text-white'}`}
            />
          </div>
          {totalReactions > 0 && (
            <span className="text-white text-xs mt-1">{totalReactions}</span>
          )}
        </button>

        <button className="flex flex-col items-center group">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          {localReel.commentsCount > 0 && (
            <span className="text-white text-xs mt-1">{localReel.commentsCount}</span>
          )}
        </button>

        <button className="flex flex-col items-center group">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Share2 className="w-6 h-6 text-white" />
          </div>
        </button>
      </div>
    </div>
  );
}

function ReelsPage({ user, onLogout }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const response = await axios.get(`${API}/reels`);
      setReels(response.data);
    } catch (error) {
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout user={user} onLogout={onLogout}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading reels...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (reels.length === 0) {
    return (
      <AppLayout user={user} onLogout={onLogout}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-lg">No reels available</p>
            <p className="text-gray-500 text-sm mt-2">Check back later for new content</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
      {reels.map(reel => (
        <ReelCard key={reel.id} reel={reel} currentUser={user} />
      ))}
    </div>
  );
}

export default ReelsPage;
