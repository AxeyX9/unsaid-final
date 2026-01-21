import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Compass, MessageCircle, Heart, User, Bookmark, LogOut, Moon } from 'lucide-react';
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
    { icon: Home, label: 'home', path: '/home' },
    { icon: Compass, label: 'explore', path: '/explore' },
    { icon: Search, label: 'search', path: '/search' },
    { icon: MessageCircle, label: 'messages', path: '/messages' },
    { icon: Heart, label: 'notifications', path: '/notifications' },
  ];

  return (
    <div className="min-h-screen bg-[#1a1d28] text-[#e5e5e5]">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#1a1d28] border-r border-[#B4A7D6]/10 hidden lg:flex flex-col z-50">
        <div className="p-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#B4A7D6]/10 rounded-full">
              <Moon className="w-7 h-7 text-[#B4A7D6]" />
            </div>
            <h1 
              className="text-3xl font-light tracking-tight text-[#e5e5e5]"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              unsaid
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              data-testid={`nav-${item.label}`}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl slow-transition font-light ${
                isActive(item.path)
                  ? 'bg-[#B4A7D6]/10 text-[#B4A7D6]'
                  : 'text-[#9ca3af] hover:bg-[#B4A7D6]/5 hover:text-[#e5e5e5]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}

          <button
            data-testid="nav-saved"
            onClick={() => navigate('/saved')}
            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl slow-transition font-light ${
              isActive('/saved')
                ? 'bg-[#B4A7D6]/10 text-[#B4A7D6]'
                : 'text-[#9ca3af] hover:bg-[#B4A7D6]/5 hover:text-[#e5e5e5]'
            }`}
          >
            <Bookmark className="w-5 h-5" />
            <span>saved</span>
          </button>

          <button
            data-testid="nav-profile"
            onClick={() => navigate(`/profile/${user.id}`)}
            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl slow-transition font-light ${
              location.pathname.includes('/profile')
                ? 'bg-[#B4A7D6]/10 text-[#B4A7D6]'
                : 'text-[#9ca3af] hover:bg-[#B4A7D6]/5 hover:text-[#e5e5e5]'
            }`}
          >
            <User className="w-5 h-5" />
            <span>profile</span>
          </button>
        </nav>

        <div className="p-4 border-t border-[#B4A7D6]/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                data-testid="user-menu-trigger"
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-[#B4A7D6]/5 slow-transition"
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full border border-[#B4A7D6]/20"
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-[#e5e5e5]">{user.displayName}</div>
                  <div className="text-sm text-[#9ca3af] font-light">@{user.username}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#212530] border-[#B4A7D6]/10 glass-card" align="end">
              <DropdownMenuItem 
                onClick={() => navigate(`/profile/${user.id}`)} 
                className="cursor-pointer hover:bg-[#B4A7D6]/10 text-[#e5e5e5]"
              >
                <User className="w-4 h-4 mr-2" />
                profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/saved')} 
                className="cursor-pointer hover:bg-[#B4A7D6]/10 text-[#e5e5e5]"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                saved posts
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#B4A7D6]/10" />
              <DropdownMenuItem 
                data-testid="logout-button"
                onClick={onLogout} 
                className="cursor-pointer text-red-400 hover:bg-red-400/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#212530]/95 backdrop-blur-lg border-t border-[#B4A7D6]/10 lg:hidden z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.path}
              data-testid={`mobile-nav-${item.label}`}
              onClick={() => navigate(item.path)}
              className={`p-2.5 rounded-lg slow-transition ${
                isActive(item.path) ? 'text-[#B4A7D6]' : 'text-[#9ca3af]'
              }`}
            >
              <item.icon className="w-6 h-6" />
            </button>
          ))}
          <button
            data-testid="mobile-nav-profile"
            onClick={() => navigate(`/profile/${user.id}`)}
            className="p-1"
          >
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt={user.displayName}
              className="w-7 h-7 rounded-full border border-[#B4A7D6]/20"
            />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
