// src/components/Pages/NotFoundPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaArrowLeft, FaSearch, FaCode, FaBug, FaRocket } from 'react-icons/fa';

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleBrowseSheets = () => {
    navigate('/sheets');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-2xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-20 w-24 h-24 bg-indigo-400/10 rounded-full blur-xl animate-pulse delay-500" />
      </div>

      <div className="text-center relative z-10 max-w-4xl mx-auto">
        
        {/* Floating Icons */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex space-x-8">
          <div className="animate-bounce delay-0">
            <FaCode className="w-6 h-6 text-blue-400/60" />
          </div>
          <div className="animate-bounce delay-200">
            <FaBug className="w-5 h-5 text-red-400/60" />
          </div>
          <div className="animate-bounce delay-400">
            <FaSearch className="w-6 h-6 text-purple-400/60" />
          </div>
        </div>

        {/* 404 Number with Animation */}
        <div className="mb-12 relative">
          <h1 className="text-8xl sm:text-9xl md:text-[12rem] font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-none select-none">
            404
          </h1>
          
          {/* Animated Underline */}
          <div className="flex justify-center">
            <div className="w-24 sm:w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse shadow-lg" />
          </div>
          
          {/* Floating Error Icon */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center animate-bounce border-4 border-red-200 dark:border-red-800 shadow-xl">
              <FaSearch className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-12 space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
            Oops! Page Not Found
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            The page you're looking for seems to have wandered off into the digital void. 
            Even the best algorithms sometimes take wrong turns! 🤖
          </p>
        </div>

        {/* Helpful Tips */}
        <div className="mb-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-center gap-2">
            <FaBug className="w-5 h-5 text-blue-500" />
            What you can do:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Check the URL for typos
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              Go back to previous page
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full" />
              Start fresh from homepage
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full" />
              Browse our DSA sheets
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <FaHome className="w-5 h-5" />
            Go Home
          </button>
          
          <button
            onClick={handleBrowseSheets}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <FaRocket className="w-5 h-5" />
            Browse Sheets
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <FaArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Fun Element */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            "In the world of algorithms, every bug is just an undiscovered feature!" 
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            {['🚀', '💻', '🔍', '⚡', '🎯'].map((emoji, index) => (
              <span 
                key={index} 
                className="text-2xl animate-bounce inline-block" 
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
