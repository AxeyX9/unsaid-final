import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import AppLayout from '@/components/AppLayout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function MessagesPage({ user, onLogout }) {
  const { userId: chatUserId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await axios.get(`${API}/conversations`);
      setConversations(response.data);
    } catch (error) {
      toast.error('failed to load conversations');
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
      toast.error('failed to load messages');
    }
  };

  const selectConversation = (conv) => {
    navigate(`/messages/${conv.user.id}`);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      const response = await axios.post(`${API}/messages`, {
        receiverId: selectedUser.id,
        text: messageText
      });
      setMessages([...messages, response.data]);
      setMessageText('');
      loadConversations();
    } catch (error) {
      toast.error('failed to send message');
    }
  };

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="h-[calc(100vh-2rem)] max-w-6xl mx-auto px-4 pb-6">
        <div className="glass-card rounded-2xl h-full overflow-hidden flex">
          {/* Conversations List */}
          <div className={`w-full lg:w-96 border-r border-[#B4A7D6]/10 ${chatUserId ? 'hidden lg:block' : 'block'}`}>
            <div className="p-6 border-b border-[#B4A7D6]/10">
              <h1 
                className="text-2xl font-light text-[#e5e5e5]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                messages
              </h1>
            </div>
            <div className="overflow-y-auto h-[calc(100%-5rem)]">
              {conversations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <MessageCircle className="w-12 h-12 text-[#9ca3af] mx-auto mb-4" />
                  <p className="text-[#9ca3af] font-light">no conversations yet</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.user.id}
                    data-testid={`conversation-${conv.user.id}`}
                    onClick={() => selectConversation(conv)}
                    className={`p-5 border-b border-[#B4A7D6]/10 cursor-pointer slow-transition hover:bg-[#B4A7D6]/5 ${
                      selectedUser?.id === conv.user.id ? 'bg-[#B4A7D6]/10' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={conv.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.user.username}`}
                        alt={conv.user.displayName}
                        className="w-12 h-12 rounded-full border border-[#B4A7D6]/20"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-[#e5e5e5] font-medium truncate">{conv.user.displayName}</h3>
                          {conv.lastMessageTime && (
                            <span className="text-xs text-[#9ca3af] font-light">
                              {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-sm text-[#9ca3af] truncate font-light">{conv.lastMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedUser ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-5 border-b border-[#B4A7D6]/10 flex items-center space-x-4">
                <button
                  onClick={() => navigate('/messages')}
                  className="lg:hidden p-2 hover:bg-[#B4A7D6]/10 rounded-lg slow-transition"
                >
                  <ArrowLeft className="w-5 h-5 text-[#e5e5e5]" />
                </button>
                <img
                  src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
                  alt={selectedUser.displayName}
                  className="w-10 h-10 rounded-full border border-[#B4A7D6]/20"
                />
                <div>
                  <h2 className="text-[#e5e5e5] font-medium">{selectedUser.displayName}</h2>
                  <p className="text-sm text-[#9ca3af] font-light">@{selectedUser.username}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => {
                  const isOwn = message.senderId === user.id;
                  return (
                    <div
                      key={index}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                          isOwn
                            ? 'bg-[#B4A7D6] text-[#1a1d28]'
                            : 'bg-[#2a2f3f]/50 text-[#e5e5e5]'
                        }`}
                      >
                        <p className="font-light leading-relaxed">{message.text}</p>
                        <p className={`text-xs mt-1.5 font-light ${isOwn ? 'text-[#1a1d28]/60' : 'text-[#9ca3af]'}`}>
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-5 border-t border-[#B4A7D6]/10">
                <div className="flex items-center space-x-3">
                  <Input
                    data-testid="message-input"
                    type="text"
                    placeholder="type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 bg-[#2a2f3f]/30 border-[#B4A7D6]/10 text-[#e5e5e5] placeholder:text-[#6b7280] h-11 slow-transition focus:border-[#B4A7D6]/30"
                  />
                  <Button
                    type="submit"
                    data-testid="send-button"
                    disabled={!messageText.trim()}
                    className="bg-[#B4A7D6] hover:bg-[#a294c4] text-[#1a1d28] h-11 w-11 p-0 slow-transition"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 hidden lg:flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-[#9ca3af] mx-auto mb-4" />
                <p className="text-[#9ca3af] text-lg font-light">select a conversation</p>
                <p className="text-[#6b7280] text-sm mt-2 font-light">
                  choose someone to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default MessagesPage;
