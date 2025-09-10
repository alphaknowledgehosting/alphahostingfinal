import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTrophy, FaFire } from 'react-icons/fa';

const ProgressBar = ({ 
  completed, 
  total, 
  label, 
  variant = 'default',
  size = 'md',
  showIcon = true,
  animated = true,
  showLabels = true,
  color = 'blue',
  className = ''
}) => {
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Animate progress on mount
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayPercentage(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayPercentage(percentage);
    }
  }, [percentage, animated]);

  // Color variants
  const colorVariants = {
    blue: {
      bg: 'bg-blue-500',
      gradient: 'from-blue-400 to-blue-600',
      text: 'text-blue-600',
      bgLight: 'bg-blue-100',
      bgDark: 'dark:bg-blue-900/20'
    },
    green: {
      bg: 'bg-green-500',
      gradient: 'from-green-400 to-green-600',
      text: 'text-green-600',
      bgLight: 'bg-green-100',
      bgDark: 'dark:bg-green-900/20'
    },
    purple: {
      bg: 'bg-purple-500',
      gradient: 'from-purple-400 to-purple-600',
      text: 'text-purple-600',
      bgLight: 'bg-purple-100',
      bgDark: 'dark:bg-purple-900/20'
    },
    orange: {
      bg: 'bg-orange-500',
      gradient: 'from-orange-400 to-orange-600',
      text: 'text-orange-600',
      bgLight: 'bg-orange-100',
      bgDark: 'dark:bg-orange-900/20'
    },
    red: {
      bg: 'bg-red-500',
      gradient: 'from-red-400 to-red-600',
      text: 'text-red-600',
      bgLight: 'bg-red-100',
      bgDark: 'dark:bg-red-900/20'
    }
  };

  // Size variants
  const sizeVariants = {
    sm: {
      height: 'h-2',
      text: 'text-xs',
      padding: 'p-3'
    },
    md: {
      height: 'h-3',
      text: 'text-sm',
      padding: 'p-4'
    },
    lg: {
      height: 'h-4',
      text: 'text-base',
      padding: 'p-5'
    },
    xl: {
      height: 'h-6',
      text: 'text-lg',
      padding: 'p-6'
    }
  };

  const currentColor = colorVariants[color] || colorVariants.blue;
  const currentSize = sizeVariants[size] || sizeVariants.md;

  // Status icon based on completion
  const getStatusIcon = () => {
    if (percentage === 100) {
      return <FaTrophy className="text-yellow-500" />;
    } else if (percentage >= 75) {
      return <FaFire className="text-orange-500" />;
    } else if (percentage > 0) {
      return <FaCheckCircle className={currentColor.text} />;
    }
    return null;
  };

  // Progress bar variants
  const renderProgressBar = () => {
    switch (variant) {
      case 'minimal':
        return (
          <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${currentSize.height} overflow-hidden`}>
            <div 
              className={`h-full bg-gradient-to-r ${currentColor.gradient} rounded-full transition-all duration-1000 ease-out ${animated ? 'transform-gpu' : ''}`}
              style={{ width: `${displayPercentage}%` }}
              role="progressbar"
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${label}: ${completed} of ${total} completed`}
            />
          </div>
        );

      case 'striped':
        return (
          <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${currentSize.height} overflow-hidden`}>
            <div 
              className={`h-full bg-gradient-to-r ${currentColor.gradient} rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${animated ? 'transform-gpu' : ''}`}
              style={{ width: `${displayPercentage}%` }}
              role="progressbar"
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${label}: ${completed} of ${total} completed`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
            </div>
          </div>
        );

      case 'segments':
        const segments = Math.min(total, 10); // Max 10 segments for visual clarity
        const segmentWidth = 100 / segments;
        const completedSegments = Math.floor((completed / total) * segments);

        return (
          <div className="flex space-x-1">
            {Array.from({ length: segments }, (_, i) => (
              <div
                key={i}
                className={`flex-1 ${currentSize.height} rounded-sm transition-all duration-300 ${
                  i < completedSegments
                    ? `bg-gradient-to-r ${currentColor.gradient}`
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                style={{ 
                  transitionDelay: animated ? `${i * 50}ms` : '0ms' 
                }}
              />
            ))}
          </div>
        );

      default:
        return (
          <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${currentSize.height} overflow-hidden shadow-inner`}>
            <div 
              className={`h-full bg-gradient-to-r ${currentColor.gradient} rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${animated ? 'transform-gpu' : ''}`}
              style={{ width: `${displayPercentage}%` }}
              role="progressbar"
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${label}: ${completed} of ${total} completed`}
            >
              {animated && displayPercentage > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full animate-pulse"></div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {showIcon && getStatusIcon()}
            <span className={`font-medium text-gray-700 dark:text-gray-300 ${currentSize.text}`}>
              {label}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${currentColor.text} dark:text-gray-300 ${currentSize.text}`}>
              {completed}/{total}
            </span>
            <span className={`text-gray-500 dark:text-gray-400 ${currentSize.text}`}>
              ({percentage}%)
            </span>
          </div>
        </div>
      )}

      {renderProgressBar()}

      {/* Completion message */}
      {percentage === 100 && (
        <div className={`mt-2 ${currentColor.bgLight} ${currentColor.bgDark} rounded-lg px-3 py-2 flex items-center space-x-2`}>
          <FaTrophy className="text-yellow-500 animate-bounce" />
          <span className={`font-medium ${currentColor.text} dark:text-gray-300 text-sm`}>
            Congratulations! {label} completed! 🎉
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
