import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import StoryViewer from './StoryViewer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function StoriesBar({ user, onCreateStory }) {
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const response = await axios.get(`${API}/stories`);
      setStories(response.data);
    } catch (error) {
      console.error('Failed to load stories');
    }
  };

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6 border border-white/10">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {/* Create Story */}
          <button
            onClick={onCreateStory}
            className="flex-shrink-0 flex flex-col items-center space-y-2 group"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  <Plus className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-400">Your Story</span>
          </button>

          {/* Stories from followed users */}
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => setSelectedStory(story)}
              className="flex-shrink-0 flex flex-col items-center space-y-2 group"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-[#0a0a0a] p-0.5">
                    <img
                      src={story.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user?.username}`}
                      alt={story.user?.displayName}
                      className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400 truncate max-w-[64px]">
                {story.user?.username}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer */}
      {selectedStory && (
        <StoryViewer
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          onNext={() => {
            const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
            if (currentIndex < stories.length - 1) {
              setSelectedStory(stories[currentIndex + 1]);
            } else {
              setSelectedStory(null);
            }
          }}
          onPrevious={() => {
            const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
            if (currentIndex > 0) {
              setSelectedStory(stories[currentIndex - 1]);
            }
          }}
        />
      )}
    </>
  );
}

export default StoriesBar;
