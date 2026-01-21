import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Send, Image as ImageIcon, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function MessagesPage({ user, onLogout }) {
  const { userId: chatUserId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (chatUserId) {
      loadChatUser(chatUserId);
    }
  }, [chatUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await axios.get(`${API}/conversations`);
      setConversations(response.data);
    } catch (error) {
      toast.error('Failed to load conversations');
    }
  };

  const loadChatUser = async (userId) => {
    try {
      const [userRes, messagesRes] = await Promise.all([
        axios.get(`${API}/users/${userId}`),
        axios.get(`${API}/messages/${userId}`)
      ]);
      setSelectedUser(userRes.data);
      setMessages(messagesRes.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const selectConversation = (conv) => {
    navigate(`/messages/${conv.userId}`);
    setSelectedUser(conv.user);
    loadChatUser(conv.userId);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !imagePreview) return;

    try {
      const response = await axios.post(`${API}/messages`, {
        receiverId: selectedUser.id,
        content: messageText,
        imageUrl: imagePreview || null
      });
      setMessages([...messages, response.data]);
      setMessageText('');
      setImagePreview('');
      loadConversations();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleTyping = () => {
    // Typing indicator functionality can be added later with WebSocket
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-void flex">
      {/* Conversations List */}
      {!chatUserId && (
        <div className="w-full max-w-md mx-auto">
          <div className="sticky top-0 z-40 backdrop-blur-xl bg-void/80 border-b border-white/5">
            <div className="px-4 py-4">
              <h1 className="font-playfair text-2xl font-bold text-white" data-testid="messages-title">Messages</h1>
            </div>
          </div>

          <div className="divide-y divide-zinc-900" data-testid="conversations-list">
            {conversations.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.userId}
                  data-testid="conversation-item"
                  onClick={() => selectConversation(conv)}
                  className="w-full flex items-start gap-3 p-4 hover:bg-zinc-900/30 transition-colors text-left"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.user.avatar} />
                    <AvatarFallback className="bg-zinc-800 text-white">
                      {conv.user.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{conv.user.displayName}</span>
                      {conv.lastMessage && (
                        <span className="text-xs text-zinc-500 font-mono">
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-zinc-400 truncate">{conv.lastMessage.content}</p>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-moonlight text-white text-xs rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat View */}
      {chatUserId && selectedUser && (
        <div className="w-full max-w-md mx-auto flex flex-col h-screen">
          {/* Chat Header */}
          <div className="sticky top-0 z-40 backdrop-blur-xl bg-void/80 border-b border-white/5">
            <div className="px-4 py-4 flex items-center gap-3">
              <Button
                data-testid="back-to-conversations-btn"
                variant="ghost"
                onClick={() => navigate('/messages')}
                className="text-white hover:text-moonlight"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar
                className="w-10 h-10 cursor-pointer"
                onClick={() => navigate(`/profile/${selectedUser.id}`)}
              >
                <AvatarImage src={selectedUser.avatar} />
                <AvatarFallback className="bg-zinc-800 text-white">
                  {selectedUser.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                className="flex-1 cursor-pointer"
                onClick={() => navigate(`/profile/${selectedUser.id}`)}
              >
                <div className="font-medium text-white" data-testid="chat-user-name">{selectedUser.displayName}</div>
                <div className="text-xs text-zinc-500">@{selectedUser.username}</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" data-testid="messages-container">
            {messages.map((msg) => {
              const isSent = msg.senderId === user.id;
              return (
                <div
                  key={msg.id}
                  data-testid="message-item"
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] space-y-1`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isSent
                          ? 'bg-moonlight text-white'
                          : 'bg-zinc-900/50 text-white'
                      }`}
                    >
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Attachment"
                          className="rounded-xl max-w-full mb-2 max-h-64 object-cover"
                        />
                      )}
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <div
                      className={`text-xs text-zinc-500 font-mono ${
                        isSent ? 'text-right' : 'text-left'
                      }`}
                    >
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      {isSent && msg.seen && <span className="ml-2">✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Typing indicator removed for now */}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-white/5 p-4">
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img src={imagePreview} alt="Preview" className="rounded-xl max-h-24 object-cover" />
                <button
                  onClick={() => setImagePreview('')}
                  className="absolute -top-2 -right-2 bg-black/70 rounded-full p-1 text-white hover:bg-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <label htmlFor="message-image-upload" className="cursor-pointer text-zinc-400 hover:text-white transition-colors">
                <ImageIcon className="w-5 h-5" />
              </label>
              <input
                id="message-image-upload"
                data-testid="message-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Input
                data-testid="message-input"
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
                className="flex-1 bg-zinc-900/50 border-transparent focus:border-moonlight/50 rounded-full text-white placeholder:text-zinc-600"
              />
              <Button
                data-testid="send-message-btn"
                type="submit"
                disabled={!messageText.trim() && !imagePreview}
                className="bg-moonlight hover:bg-moonlight-hover text-white rounded-full w-10 h-10 p-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;