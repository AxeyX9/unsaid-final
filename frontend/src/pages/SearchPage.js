import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Search, User, Hash, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/AppLayout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function SearchPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], hashtags: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      const response = await axios.get(`${API}/trending/hashtags`);
      setTrending(response.data);
    } catch (error) {
      console.error('Failed to load trending');
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults({ users: [], hashtags: [], posts: [] });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (userId, isFollowing) => {
    try {
      if (isFollowing) {
        await axios.post(`${API}/users/${userId}/unfollow`);
      } else {
        await axios.post(`${API}/users/${userId}/follow`);
      }
      
      // Update local state
      setSearchResults(prev => ({
        ...prev,
        users: prev.users.map(u => 
          u.id === userId ? { ...u, isFollowing: !isFollowing } : u
        )
      }));
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="max-w-4xl mx-auto pb-20">
        {/* Search Header */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users, hashtags, posts..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 bg-[#1a1a1a] border-white/10 text-white h-12 text-lg"
            />
          </div>
        </div>

        {searchQuery.trim().length < 2 ? (
          /* Trending Section */
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-purple-400" />
                Trending Hashtags
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trending.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSearch(tag.hashtag)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-purple-400 font-medium text-lg">{tag.hashtag}</div>
                        <div className="text-gray-400 text-sm">{tag.count} posts</div>
                      </div>
                      <Hash className="w-8 h-8 text-purple-400/30" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Search Results */
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] mb-6">
              <TabsTrigger value="users">
                Users ({searchResults.users.length})
              </TabsTrigger>
              <TabsTrigger value="hashtags">
                Hashtags ({searchResults.hashtags.length})
              </TabsTrigger>
              <TabsTrigger value="posts">
                Posts ({searchResults.posts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                </div>
              ) : searchResults.users.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No users found
                </div>
              ) : (
                searchResults.users.map(foundUser => (
                  <div
                    key={foundUser.id}
                    className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10 flex items-center justify-between"
                  >
                    <div
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                      onClick={() => navigate(`/profile/${foundUser.id}`)}
                    >
                      <img
                        src={foundUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${foundUser.username}`}
                        alt={foundUser.displayName}
                        className="w-12 h-12 rounded-full border-2 border-purple-500"
                      />
                      <div>
                        <div className="font-medium">{foundUser.displayName}</div>
                        <div className="text-sm text-gray-400">@{foundUser.username}</div>
                        {foundUser.bio && (
                          <div className="text-sm text-gray-500 mt-1">{foundUser.bio}</div>
                        )}
                      </div>
                    </div>
                    {foundUser.id !== user.id && (
                      <button
                        onClick={() => handleFollowUser(foundUser.id, foundUser.isFollowing)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          foundUser.isFollowing
                            ? 'bg-white/10 hover:bg-white/20'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                        }`}
                      >
                        {foundUser.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="hashtags" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                </div>
              ) : searchResults.hashtags.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No hashtags found
                </div>
              ) : (
                searchResults.hashtags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSearch(tag.hashtag)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-purple-400 font-medium text-lg">{tag.hashtag}</div>
                        <div className="text-gray-400 text-sm">{tag.count} posts</div>
                      </div>
                      <Hash className="w-8 h-8 text-purple-400/30" />
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                </div>
              ) : searchResults.posts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No posts found
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {searchResults.posts.map(post => (
                    <div
                      key={post.id}
                      className="aspect-square cursor-pointer group relative overflow-hidden"
                      onClick={() => navigate(`/home`)}
                    >
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt="Post"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center p-4">
                          <p className="text-sm text-center line-clamp-4">{post.text}</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-white font-medium">
                            {Object.values(post.reactions).reduce((a, b) => a + b, 0)} reactions
                          </div>
                          <div className="text-white/70 text-sm">
                            {post.commentsCount} comments
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}

export default SearchPage;
