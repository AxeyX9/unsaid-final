import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Settings, User as UserIcon } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import PostCard from '@/components/PostCard';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ProfilePage({ user, onLogout }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user.id === userId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        axios.get(`${API}/users/${userId}`),
        axios.get(`${API}/users/${userId}/posts`)
      ]);
      
      setProfile(profileRes.data);
      setPosts(postsRes.data);

      if (!isOwnProfile) {
        const followRes = await axios.get(`${API}/users/${userId}/is-following`);
        setIsFollowing(followRes.data.isFollowing);
      }
    } catch (error) {
      toast.error('failed to load profile');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const response = await axios.post(`${API}/users/${userId}/follow`);
      setIsFollowing(response.data.isFollowing);
      
      setProfile({
        ...profile,
        followersCount: profile.followersCount + (response.data.isFollowing ? 1 : -1)
      });
    } catch (error) {
      toast.error('failed to update follow');
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  if (loading) {
    return (
      <AppLayout user={user} onLogout={onLogout}>
        <div className="text-center py-16">
          <div className="w-12 h-12 border-2 border-[#B4A7D6]/30 border-t-[#B4A7D6] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#9ca3af] mt-4 font-light">loading profile...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="max-w-4xl mx-auto pb-20 px-4">
        {/* Profile Header */}
        <div className="mb-10 pt-6">
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-6">
                <img
                  src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                  alt={profile.displayName}
                  className="w-24 h-24 rounded-full border-2 border-[#B4A7D6]/30"
                />
                <div>
                  <h1 
                    className="text-3xl font-light text-[#e5e5e5] mb-1"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {profile.displayName}
                  </h1>
                  <p className="text-[#9ca3af] font-light">@{profile.username}</p>
                </div>
              </div>
              
              {isOwnProfile ? (
                <Button
                  data-testid="settings-button"
                  onClick={() => navigate('/settings')}
                  variant="outline"
                  className="border-[#B4A7D6]/20 text-[#e5e5e5] hover:bg-[#B4A7D6]/10 slow-transition"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  settings
                </Button>
              ) : (
                <Button
                  data-testid="follow-button"
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`slow-transition ${
                    isFollowing
                      ? 'bg-[#2a2f3f]/50 text-[#e5e5e5] hover:bg-[#2a2f3f]/70 border border-[#B4A7D6]/20'
                      : 'bg-[#B4A7D6] hover:bg-[#a294c4] text-[#1a1d28]'
                  }`}
                >
                  {followLoading ? '...' : isFollowing ? 'following' : 'follow'}
                </Button>
              )}
            </div>

            {profile.bio && (
              <p className="text-[#9ca3af] mb-6 leading-relaxed font-light">
                {profile.bio}
              </p>
            )}

            <div className="flex items-center space-x-8 text-sm">
              <div>
                <span className="text-[#e5e5e5] font-medium">{profile.postsCount || 0}</span>
                <span className="text-[#9ca3af] font-light ml-1.5">thoughts</span>
              </div>
              <div>
                <span className="text-[#e5e5e5] font-medium">{profile.followersCount || 0}</span>
                <span className="text-[#9ca3af] font-light ml-1.5">connections</span>
              </div>
              <div>
                <span className="text-[#e5e5e5] font-medium">{profile.followingCount || 0}</span>
                <span className="text-[#9ca3af] font-light ml-1.5">connected to</span>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div>
          <h2 
            className="text-xl font-light text-[#e5e5e5] mb-6"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            thoughts
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <UserIcon className="w-12 h-12 text-[#9ca3af] mx-auto mb-4" />
              <p className="text-[#9ca3af] text-lg font-light">
                {isOwnProfile ? 'you haven\'t shared anything yet' : 'no thoughts shared yet'}
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
      </div>
    </AppLayout>
  );
}

export default ProfilePage;
