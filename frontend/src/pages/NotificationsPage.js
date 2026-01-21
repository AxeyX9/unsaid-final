import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, MessageCircle, UserPlus, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AppLayout from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function NotificationsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`);
      setNotifications(response.data);
      // Mark as read
      await axios.post(`${API}/notifications/read`);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
      case 'reaction':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      default:
        return <UserIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like':
      case 'reaction':
        return `reacted to your post`;
      case 'comment':
        return `commented on your post`;
      case 'follow':
        return `started following you`;
      default:
        return notification.text;
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.postId) {
      navigate('/home');
    } else if (notification.fromUserId) {
      navigate(`/profile/${notification.fromUserId}`);
    }
  };

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="max-w-2xl mx-auto pb-20">
        <h1 className="text-3xl font-bold mb-6">Notifications</h1>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="follows">Follows</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-white/10">
                <p className="text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`bg-[#1a1a1a] rounded-xl p-4 border border-white/10 flex items-center space-x-4 cursor-pointer hover:bg-white/5 transition-colors ${
                      !notification.read ? 'border-purple-500/50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <img
                      src={notification.fromUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.fromUser?.username}`}
                      alt={notification.fromUser?.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-white">
                        <span className="font-medium">{notification.fromUser?.displayName}</span>
                        {' '}
                        <span className="text-gray-400">{getNotificationText(notification)}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {notification.postImage && (
                      <img
                        src={notification.postImage}
                        alt="Post"
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="follows">
            <div className="space-y-2">
              {notifications
                .filter(n => n.type === 'follow')
                .map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => navigate(`/profile/${notification.fromUserId}`)}
                    className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10 flex items-center space-x-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <UserPlus className="w-5 h-5 text-green-500" />
                    <img
                      src={notification.fromUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.fromUser?.username}`}
                      alt={notification.fromUser?.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-white">
                        <span className="font-medium">{notification.fromUser?.displayName}</span>
                        {' '}
                        <span className="text-gray-400">started following you</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="interactions">
            <div className="space-y-2">
              {notifications
                .filter(n => n.type === 'like' || n.type === 'comment' || n.type === 'reaction')
                .map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10 flex items-center space-x-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <img
                      src={notification.fromUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.fromUser?.username}`}
                      alt={notification.fromUser?.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-white">
                        <span className="font-medium">{notification.fromUser?.displayName}</span>
                        {' '}
                        <span className="text-gray-400">{getNotificationText(notification)}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {notification.postImage && (
                      <img
                        src={notification.postImage}
                        alt="Post"
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

export default NotificationsPage;
