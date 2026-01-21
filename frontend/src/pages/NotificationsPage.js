import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, User, Bell } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function NotificationsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    markAsRead();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      toast.error('failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await axios.post(`${API}/notifications/read`);
    } catch (error) {
      // Silent fail
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
      case 'reaction':
        return <Heart className="w-5 h-5 text-[#B4A7D6]" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-[#B4A7D6]" />;
      case 'follow':
        return <User className="w-5 h-5 text-[#B4A7D6]" />;
      default:
        return <Bell className="w-5 h-5 text-[#B4A7D6]" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.postId) {
      navigate(`/home`); // Navigate to home where the post would be
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.actorId}`);
    }
  };

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="max-w-3xl mx-auto pb-20 px-4">
        <div className="mb-10 pt-6">
          <h1 
            className="text-3xl font-light text-[#e5e5e5] mb-2"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            notifications
          </h1>
          <p className="text-[#9ca3af] font-light">
            quiet updates, no noise
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-2 border-[#B4A7D6]/30 border-t-[#B4A7D6] rounded-full animate-spin mx-auto"></div>
            <p className="text-[#9ca3af] mt-4 font-light">loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <Bell className="w-12 h-12 text-[#9ca3af] mx-auto mb-4" />
            <p className="text-[#9ca3af] text-lg font-light">no notifications yet</p>
            <p className="text-[#6b7280] text-sm mt-2 font-light">
              you'll see updates here when someone interacts with you
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                data-testid={`notification-${notification.id}`}
                onClick={() => handleNotificationClick(notification)}
                className="glass-card rounded-xl p-5 slow-transition hover:border-[#B4A7D6]/30 cursor-pointer animate-fade-in"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-2.5 bg-[#B4A7D6]/10 rounded-full flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center space-x-3 flex-1">
                        {notification.actor && (
                          <img
                            src={notification.actor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.actor.username}`}
                            alt={notification.actor.displayName}
                            className="w-10 h-10 rounded-full border border-[#B4A7D6]/20"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-[#e5e5e5] font-light leading-relaxed">
                            {notification.text}
                          </p>
                          <p className="text-xs text-[#9ca3af] mt-1 font-light">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
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

export default NotificationsPage;
