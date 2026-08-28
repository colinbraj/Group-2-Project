import React, { useState } from 'react';
import { Check, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { signIn } from '../services/authService';
import { AuthUser } from '../services/authService';

interface LoginProps {
  onLogin: (user: AuthUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        onLogin(result.user);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 relative overflow-hidden">

      {/* Subtle Background Decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Left Column: Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        <div className="mb-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <img
              src="/logo.png"
              alt="KadoshAI Logo"
              className="w-10 h-10 rounded-xl shadow-lg shadow-slate-900/20"
            />
            <span className="text-2xl font-bold tracking-tight text-slate-900">KadoshAI</span>
          </div>

          <h1 className="text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Welcome back
          </h1>
          <p className="text-lg text-slate-600">
            Sign in to continue to your workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-900 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl focus:outline-none transition-all text-sm placeholder-slate-400 font-medium text-slate-900 shadow-sm"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-900 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl focus:outline-none transition-all text-sm placeholder-slate-400 font-medium text-slate-900 shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer shadow-sm" />
                <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3]" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors select-none">Remember me</span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            style={{ backgroundColor: isLoading ? '#94a3b8' : '#2563eb', color: '#ffffff' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in to your account'
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-200">
          <p className="text-center text-sm text-slate-500">
            Contact your administrator if you need an account
          </p>
        </div>
      </div>

      {/* Right Column: Feature Showcase */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8 border border-white/20">
            <Sparkles size={16} className="text-blue-400" />
            AI-Powered Social Media Management
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Manage your social media presence with AI
          </h2>
          <p className="text-xl text-slate-300 leading-relaxed">
            Automate replies, schedule posts, and engage with your audience using intelligent AI assistance.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Check size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">AI-Powered Replies</h3>
              <p className="text-sm text-slate-400">Automatically suggest context-aware replies to comments and messages</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Check size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Smart Scheduling</h3>
              <p className="text-sm text-slate-400">Plan and publish content across multiple platforms from one dashboard</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Check size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Content Repurposing</h3>
              <p className="text-sm text-slate-400">Transform your content into multiple formats optimized for each platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};