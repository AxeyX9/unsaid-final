import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';

function ReelsPage({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="max-w-3xl mx-auto pb-20 px-4">
        <div className="mb-10 pt-6">
          <h1 
            className="text-3xl font-light text-[#e5e5e5] mb-2"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            moments
          </h1>
          <p className="text-[#9ca3af] font-light">
            not available yet
          </p>
        </div>

        <div className="text-center py-16 glass-card rounded-2xl">
          <Video className="w-12 h-12 text-[#9ca3af] mx-auto mb-4" />
          <p className="text-[#9ca3af] text-lg font-light">coming soon</p>
          <p className="text-[#6b7280] text-sm mt-2 mb-6 font-light">
            this feature doesn't quite fit the unsaid philosophy yet.<br />
            we're thinking about how to make it calm and intentional.
          </p>
          <Button
            onClick={() => navigate('/home')}
            className="bg-[#B4A7D6] hover:bg-[#a294c4] text-[#1a1d28] slow-transition"
          >
            back to home
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

export default ReelsPage;
