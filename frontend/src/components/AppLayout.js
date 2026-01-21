import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Compass, Video, MessageCircle, Heart, User, Bookmark, LogOut, Instagram } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function AppLayout({ children, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Video, label: 'Reels', path: '/reels' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Heart, label: 'Notifications', path: '/notifications' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0a0a0a] border-r border-white/10 hidden lg:flex flex-col z-50">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <Instagram className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              InstaSocial
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl mb-2 transition-all ${
                isActive(item.path)
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive(item.path) ? 'fill-white' : ''}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <button
            onClick={() => navigate('/saved')}
            className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl mb-2 transition-all ${
              isActive('/saved')
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Bookmark className={`w-6 h-6 ${isActive('/saved') ? 'fill-white' : ''}`} />
            <span className="font-medium">Saved</span>
          </button>

          <button
            onClick={() => navigate(`/profile/${user.id}`)}
            className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl mb-2 transition-all ${
              location.pathname.includes('/profile')
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="font-medium">Profile</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full border-2 border-purple-500"
                />
                <div className="flex-1 text-left">
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-sm text-gray-400">@{user.username}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#1a1a1a] border-white/10" align="end">
              <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)} className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/saved')} className="cursor-pointer">
                <Bookmark className="w-4 h-4 mr-2" />
                Saved Posts
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-white/10 lg:hidden z-50">
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`p-2 rounded-lg transition-colors ${
                isActive(item.path) ? 'text-white' : 'text-gray-400'
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive(item.path) ? 'fill-white' : ''}`} />
            </button>
          ))}
          <button
            onClick={() => navigate(`/profile/${user.id}`)}
            className="p-2"
          >
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt={user.displayName}
              className="w-6 h-6 rounded-full"
            />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
