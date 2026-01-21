import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Pages
import LandingPage from '@/pages/LandingPage';
import HomePage from '@/pages/HomePage';
import ProfilePage from '@/pages/ProfilePage';
import MessagesPage from '@/pages/MessagesPage';
import ExplorePage from '@/pages/ExplorePage';
import ReelsPage from '@/pages/ReelsPage';
import SearchPage from '@/pages/SearchPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SavedPage from '@/pages/SavedPage';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Axios interceptor for auth
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token
      axios.get(`${API}/auth/me`)
        .then(res => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-2xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={!user ? <LandingPage onLogin={login} /> : <Navigate to="/home" />}
          />
          <Route
            path="/home"
            element={user ? <HomePage user={user} onLogout={logout} /> : <Navigate to="/" />}
          />
          <Route
            path="/explore"
            element={user ? <ExplorePage user={user} onLogout={logout} /> : <Navigate to="/" />}
          />
          <Route
            path="/reels"
            element={user ? <ReelsPage user={user} onLogout={logout} /> : <Navigate to="/" />}
          />
          <Route
            path="/search"
            element={user ? <SearchPage user={user} onLogout={logout} /> : <Navigate to="/" />}
          />
          <Route
            path="/notifications"
            element={user ? <NotificationsPage user={user} onLogout={logout} /> : <Navigate to="/" />}
          />
          <Route
            path="/saved"
            element={user ? <SavedPage user={user} onLogout={logout} /> : <Navigate to="/" />}
          />
          <Route
            path="/profile/:userId"
            element={user ? <ProfilePage user={user} onLogout={logout} /> : <Navigate to="/" />}
          />
          <Route
            path="/messages"
            element={user ? <MessagesPage user={user} onLogout={logout} /> : <Navigate to="/" />}
          />
          <Route
            path="/messages/:userId"
            element={user ? <MessagesPage user={user} onLogout={logout} /> : <Navigate to="/" />}
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}

export default App;
