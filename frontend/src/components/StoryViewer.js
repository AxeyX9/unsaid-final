import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function StoryViewer({ story, onClose, onNext, onPrevious }) {
  const [progress, setProgress] = useState(0);
  const STORY_DURATION = 5000; // 5 seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          onNext();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [story, onNext]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress Bar */}
      <div className="absolute top-4 left-0 right-0 px-4 z-10">
        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 px-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <img
            src={story.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user?.username}`}
            alt={story.user?.displayName}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <div className="text-white font-medium">{story.user?.displayName}</div>
            <div className="text-white/70 text-xs">
              {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <button
        onClick={onPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-3 rounded-full transition-colors z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-3 rounded-full transition-colors z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Story Content */}
      <div className="max-w-lg w-full h-full flex items-center justify-center">
        {story.imageUrl ? (
          <img
            src={story.imageUrl}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : story.videoUrl ? (
          <video
            src={story.videoUrl}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
          />
        ) : (
          <div className="text-white text-center p-8">
            <p className="text-2xl">{story.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoryViewer;
