import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Search as SearchIcon, User } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Input } from '@/components/ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function SearchPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await axios.get(`${API}/users/search/${query}`);
      setResults(response.data);
    } catch (error) {
      toast.error('search failed');
    } finally {
      setLoading(false);
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
            find people
          </h1>
          <p className="text-[#9ca3af] font-light">
            discover and connect with others
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-10">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
            <Input
              data-testid="search-input"
              type="text"
              placeholder="search by name or username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#2a2f3f]/30 border-[#B4A7D6]/10 text-[#e5e5e5] placeholder:text-[#6b7280] h-14 pl-12 pr-4 rounded-xl slow-transition focus:border-[#B4A7D6]/30"
            />
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-2 border-[#B4A7D6]/30 border-t-[#B4A7D6] rounded-full animate-spin mx-auto"></div>
            <p className="text-[#9ca3af] mt-4 font-light">searching...</p>
          </div>
        ) : !searched ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <SearchIcon className="w-12 h-12 text-[#9ca3af] mx-auto mb-4" />
            <p className="text-[#9ca3af] text-lg font-light">search for people</p>
            <p className="text-[#6b7280] text-sm mt-2 font-light">
              find someone to connect with
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <User className="w-12 h-12 text-[#9ca3af] mx-auto mb-4" />
            <p className="text-[#9ca3af] text-lg font-light">no results found</p>
            <p className="text-[#6b7280] text-sm mt-2 font-light">
              try a different search term
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(result => (
              <div
                key={result.id}
                data-testid={`search-result-${result.id}`}
                onClick={() => navigate(`/profile/${result.id}`)}
                className="glass-card rounded-xl p-5 slow-transition hover:border-[#B4A7D6]/30 cursor-pointer animate-fade-in"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={result.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.username}`}
                    alt={result.displayName}
                    className="w-14 h-14 rounded-full border border-[#B4A7D6]/20"
                  />
                  <div className="flex-1">
                    <h3 className="text-[#e5e5e5] font-medium">{result.displayName}</h3>
                    <p className="text-[#9ca3af] text-sm font-light">@{result.username}</p>
                    {result.bio && (
                      <p className="text-[#6b7280] text-sm mt-1 font-light line-clamp-1">
                        {result.bio}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-[#9ca3af] font-light">
                    {result.followersCount} connections
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

export default SearchPage;
