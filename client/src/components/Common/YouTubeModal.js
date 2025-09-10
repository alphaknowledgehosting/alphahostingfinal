import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FaTimes,
  FaYoutube,
  FaExpand,
  FaCompress,
  FaExternalLinkAlt,
  FaExclamationTriangle
} from 'react-icons/fa';

const YouTubeModal = ({
  videoUrl,
  isOpen,
  onClose,
  problemName,
  autoplay = true,
  showControls = true,
  theme = 'dark'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const getVideoId = useCallback((url) => {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }, []);

  const videoId = getVideoId(videoUrl);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInNewTab = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden';
      setIsLoading(true);
      setHasError(false);
    } else {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyPress]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!isOpen) return null;

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&showinfo=0&controls=${showControls ? 1 : 0}${theme === 'dark' ? '&color=white' : ''}`
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Enhanced Backdrop with Brand Colors */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal Container with Glassmorphism */}
      <div
        className={`
          relative w-full max-w-6xl mx-auto 
          bg-white/95 dark:bg-black/90 backdrop-blur-xl
          rounded-3xl shadow-2xl overflow-hidden
          border border-white/20 dark:border-white/10
          transform transition-all duration-300 ease-out
          ${isFullscreen ? 'fixed inset-4' : 'max-h-[90vh]'}
          animate-in zoom-in-95 fade-in duration-300
        `}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header with Brand Styling */}
<div className="flex items-center justify-between p-4 lg:p-6 bg-gray-50/80 dark:bg-black/50 backdrop-blur-sm border-b border-gray-200/50 dark:border-white/10">
  <div className="flex items-center space-x-3">
    <div className="text-red-600 dark:text-red-500">
      <FaYoutube className="w-12 h-12" />
    </div>
    <div>
      {problemName && (
        <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
          {problemName}
        </h3>
      )}
    </div>
  </div>

  {/* Action Buttons with Brand Colors */}
  <div className="flex items-center space-x-2">
    {videoUrl && (
      <button
        onClick={openInNewTab}
        className="group relative p-3 text-gray-600 dark:text-gray-400 hover:text-[#6366f1] dark:hover:text-[#a855f7] transition-all duration-200"
        title="Open in new tab"
      >
        <div className="absolute inset-0 bg-[#6366f1]/10 dark:bg-[#a855f7]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        <FaExternalLinkAlt className="w-4 h-4 relative z-10" />
      </button>
    )}
    <button
      onClick={toggleFullscreen}
      className="group relative p-3 text-gray-600 dark:text-gray-400 hover:text-[#6366f1] dark:hover:text-[#a855f7] transition-all duration-200"
      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      <div className="absolute inset-0 bg-[#6366f1]/10 dark:bg-[#a855f7]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      {isFullscreen ? <FaCompress className="w-4 h-4 relative z-10" /> : <FaExpand className="w-4 h-4 relative z-10" />}
    </button>
    <button
      onClick={onClose}
      className="group relative p-3 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-all duration-200"
      title="Close modal (ESC)"
    >
      <div className="absolute inset-0 bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      <FaTimes className="w-4 h-4 relative z-10" />
    </button>
  </div>
</div>


        {/* Video Content */}
        <div className={`relative bg-black ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[60vh]'}`}>
          {embedUrl ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-sm">
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin mx-auto"></div>
                      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[#a855f7] rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s', animationDirection: 'reverse' }}></div>
                    </div>
                    <div>
                      <p className="text-white text-lg font-semibold">Loading video...</p>
                      <p className="text-gray-400 text-sm mt-1">Please wait while we prepare your content</p>
                    </div>
                  </div>
                </div>
              )}

              {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-sm">
                  <div className="text-center space-y-6 p-8 max-w-md">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-red-500/30">
                        <FaExclamationTriangle className="w-10 h-10 text-red-400" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">Failed to load video</h4>
                      <p className="text-gray-400 leading-relaxed">
                        There was an error loading the video. Please try again later.
                      </p>
                    </div>
                    <button
                      onClick={openInNewTab}
                      className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white rounded-xl hover:from-[#5855eb] hover:to-[#9333ea] transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      <FaYoutube className="w-5 h-5" />
                      <span className="font-medium">Watch on YouTube</span>
                    </button>
                  </div>
                </div>
              )}

              <iframe
                src={embedUrl}
                title={`Editorial Video${problemName ? ` - ${problemName}` : ''}`}
                className="absolute inset-0 w-full h-full border-0 rounded-lg"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                loading="lazy"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-sm p-8">
              <div className="text-center space-y-6 max-w-lg">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-red-500/30">
                    <FaExclamationTriangle className="w-12 h-12 text-red-400" />
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white mb-3">Invalid Video URL</h4>
                  <p className="text-gray-400 leading-relaxed text-lg">
                    The video URL provided is not valid or accessible. Please check the URL and try again.
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <p className="text-sm text-gray-300 font-semibold mb-3">Supported formats:</p>
                  <ul className="space-y-2 text-left text-gray-400">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#6366f1] rounded-full"></div>
                      <span>youtube.com/watch?v=VIDEO_ID</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#a855f7] rounded-full"></div>
                      <span>youtu.be/VIDEO_ID</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#6366f1] rounded-full"></div>
                      <span>youtube.com/embed/VIDEO_ID</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Brand Styling */}
        <div className="px-4 lg:px-6 py-4 bg-gray-50/80 dark:bg-black/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="w-1.5 h-1.5 bg-[#6366f1] rounded-full animate-pulse"></div>
              <span>Press ESC to close</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Use fullscreen for better viewing</span>
              <div className="w-1.5 h-1.5 bg-[#a855f7] rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default YouTubeModal;
