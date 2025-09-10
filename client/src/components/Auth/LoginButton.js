import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { googleLogout } from '@react-oauth/google';
import { FaGoogle } from 'react-icons/fa';
import { Loader2, LogOut, User } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginButton = ({ variant = 'primary', onLoginSuccess }) => {
  const { user, logout, loginWithToken, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);

      const token = credentialResponse?.credential;
      if (!token) {
        toast.error('Google credential missing. Please try again.'); 
        return;
      }

      // IMPORTANT: use the returned user, not the stale context value
      const signedInUser = await loginWithToken(token);

      toast.success(`Welcome back${signedInUser?.name ? ', ' + signedInUser.name : ''}! 🎉`);

      onLoginSuccess?.();
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = () => {
    console.error('❌ Google login failed');
    toast.error('Google authentication failed. Please try again.');
    setIsLoading(false);
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      // Ensure Google One Tap/session is fully cleared
      try { googleLogout(); } catch (_) {}

      await logout();
      toast.success('Logged out successfully! See you soon! 👋');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(w => w).join('').toUpperCase().slice(0, 2);
  };

  if (user) {
    const initials = getInitials(user.name);

    return (
      <div className="flex items-center gap-3">
        {/* Profile Avatar with Fallback */}
        <div className="relative group">
          {user.profilePicture ? (
            <div className="relative">
              <img
                src={user.profilePicture}
                alt={user.name || 'User'}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/30 dark:border-white/20 shadow-lg transition-all duration-200 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="hidden w-10 h-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#a855f7] items-center justify-center text-white font-bold text-sm select-none border-2 border-white/30 dark:border-white/20 shadow-lg transition-all duration-200 group-hover:scale-105">
                {initials || <User className="w-5 h-5" />}
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white font-bold text-sm select-none border-2 border-white/30 dark:border-white/20 shadow-lg transition-all duration-200 group-hover:scale-105">
              {initials || <User className="w-5 h-5" />}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-300 -z-10"></div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoading || loading}
          className="group relative inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-red-500/80 dark:bg-red-500/70 backdrop-blur-sm hover:bg-red-600 text-white shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed border border-red-400/30 dark:border-red-400/20 hover:border-red-300/50"
        >
          {(isLoading || loading) && (
            <div className="absolute inset-0 bg-red-600/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            </div>
          )}

          <div className="flex items-center gap-2 relative z-10">
            {!(isLoading || loading) && <LogOut className="w-4 h-4" />}
            <span>{(isLoading || loading) ? 'Signing out...' : 'Sign Out'}</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      {/* Full-width loading overlay that matches button dimensions */}
      {(isLoading || loading) && (
        <div className="absolute inset-0 bg-white/95 dark:bg-black/95 rounded-xl flex items-center justify-center z-20 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="w-5 h-5 border-2 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Signing in...
            </span>
          </div>
        </div>
      )}

      {/* Google Login Button */}
      <div className={`transition-opacity duration-200 ${(isLoading || loading) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          useOneTap={false}
          size="large"
          text="signin_with"
          shape="rectangular"
          logo_alignment="left"
        />
      </div>
    </div>
  );
};

export default LoginButton;
