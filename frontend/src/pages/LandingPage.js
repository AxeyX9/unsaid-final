import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Moon, Heart, MessageCircle, Lock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function LandingPage({ onLogin }) {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    username: '',
    email: '',
    password: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, loginForm);
      onLogin(response.data.user, response.data.token);
      toast.success('welcome back');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupForm.password.length < 6) {
      toast.error('password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/signup`, signupForm);
      onLogin(response.data.user, response.data.token);
      toast.success('welcome to unsaid');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1d28] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#B4A7D6]/5 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-16 items-center relative z-10 animate-fade-in">
        {/* Left side - Branding */}
        <div className="text-[#e5e5e5] space-y-12 hidden md:block">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#B4A7D6]/10 rounded-full">
                <Moon className="w-10 h-10 text-[#B4A7D6]" />
              </div>
              <h1 className="text-6xl font-light tracking-tight text-[#e5e5e5]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                unsaid
              </h1>
            </div>
            <p className="text-xl text-[#9ca3af] leading-relaxed font-light">
              a space for what you never say out loud
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-start space-x-4 p-5 glass-card rounded-2xl slow-transition glass-hover">
                <div className="p-2 bg-[#B4A7D6]/10 rounded-lg mt-1">
                  <Heart className="w-5 h-5 text-[#B4A7D6]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[#e5e5e5] mb-1.5">emotion over flex</h3>
                  <p className="text-sm text-[#9ca3af] leading-relaxed font-light">
                    no follower counts, no viral pressure. just honest thoughts
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-4 p-5 glass-card rounded-2xl slow-transition glass-hover">
                <div className="p-2 bg-[#B4A7D6]/10 rounded-lg mt-1">
                  <Lock className="w-5 h-5 text-[#B4A7D6]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[#e5e5e5] mb-1.5">post anonymously</h3>
                  <p className="text-sm text-[#9ca3af] leading-relaxed font-light">
                    share what matters without judgment
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-4 p-5 glass-card rounded-2xl slow-transition glass-hover">
                <div className="p-2 bg-[#B4A7D6]/10 rounded-lg mt-1">
                  <MessageCircle className="w-5 h-5 text-[#B4A7D6]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[#e5e5e5] mb-1.5">calm conversations</h3>
                  <p className="text-sm text-[#9ca3af] leading-relaxed font-light">
                    no notifications spam, just meaningful connections
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="animate-slide-up">
          <Card className="bg-[#212530]/50 glass-card border-[#B4A7D6]/10 calm-shadow">
            <div className="p-8 space-y-6">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-3xl font-light text-[#e5e5e5]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  welcome
                </h2>
                <p className="text-[#9ca3af] font-light">
                  give your thoughts a place to rest
                </p>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#2a2f3f]/50 border border-[#B4A7D6]/10">
                  <TabsTrigger 
                    value="login" 
                    data-testid="login-tab"
                    className="data-[state=active]:bg-[#B4A7D6]/20 data-[state=active]:text-[#B4A7D6] slow-transition"
                  >
                    sign in
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    data-testid="signup-tab"
                    className="data-[state=active]:bg-[#B4A7D6]/20 data-[state=active]:text-[#B4A7D6] slow-transition"
                  >
                    create account
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-[#e5e5e5] font-light text-sm">
                        email
                      </Label>
                      <Input
                        id="login-email"
                        data-testid="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                        className="bg-[#2a2f3f]/30 border-[#B4A7D6]/10 text-[#e5e5e5] placeholder:text-[#6b7280] h-12 slow-transition focus:border-[#B4A7D6]/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-[#e5e5e5] font-light text-sm">
                        password
                      </Label>
                      <Input
                        id="login-password"
                        data-testid="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        className="bg-[#2a2f3f]/30 border-[#B4A7D6]/10 text-[#e5e5e5] placeholder:text-[#6b7280] h-12 slow-transition focus:border-[#B4A7D6]/30"
                      />
                    </div>
                    <Button
                      type="submit"
                      data-testid="login-submit"
                      disabled={loading}
                      className="w-full bg-[#B4A7D6] hover:bg-[#a294c4] text-[#1a1d28] h-12 font-medium slow-transition"
                    >
                      {loading ? 'signing in...' : 'sign in'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-username" className="text-[#e5e5e5] font-light text-sm">
                        username
                      </Label>
                      <Input
                        id="signup-username"
                        data-testid="signup-username"
                        placeholder="johndoe"
                        value={signupForm.username}
                        onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                        required
                        className="bg-[#2a2f3f]/30 border-[#B4A7D6]/10 text-[#e5e5e5] placeholder:text-[#6b7280] h-12 slow-transition focus:border-[#B4A7D6]/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-displayName" className="text-[#e5e5e5] font-light text-sm">
                        display name
                      </Label>
                      <Input
                        id="signup-displayName"
                        data-testid="signup-displayname"
                        placeholder="John Doe"
                        value={signupForm.displayName}
                        onChange={(e) => setSignupForm({ ...signupForm, displayName: e.target.value })}
                        required
                        className="bg-[#2a2f3f]/30 border-[#B4A7D6]/10 text-[#e5e5e5] placeholder:text-[#6b7280] h-12 slow-transition focus:border-[#B4A7D6]/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-[#e5e5e5] font-light text-sm">
                        email
                      </Label>
                      <Input
                        id="signup-email"
                        data-testid="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                        className="bg-[#2a2f3f]/30 border-[#B4A7D6]/10 text-[#e5e5e5] placeholder:text-[#6b7280] h-12 slow-transition focus:border-[#B4A7D6]/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-[#e5e5e5] font-light text-sm">
                        password
                      </Label>
                      <Input
                        id="signup-password"
                        data-testid="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                        className="bg-[#2a2f3f]/30 border-[#B4A7D6]/10 text-[#e5e5e5] placeholder:text-[#6b7280] h-12 slow-transition focus:border-[#B4A7D6]/30"
                      />
                    </div>
                    <Button
                      type="submit"
                      data-testid="signup-submit"
                      disabled={loading}
                      className="w-full bg-[#B4A7D6] hover:bg-[#a294c4] text-[#1a1d28] h-12 font-medium slow-transition"
                    >
                      {loading ? 'creating account...' : 'create account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
