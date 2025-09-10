// Enhanced utility functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatExactTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Always show exact date and time
  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  const exactTime = date.toLocaleString('en-IN', options);
  
  // Calculate time difference for additional context
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  let timeAgo = '';
  if (diffInMinutes < 1) {
    timeAgo = 'Just now';
  } else if (diffInMinutes < 60) {
    timeAgo = `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    timeAgo = `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    timeAgo = `${diffInDays}d ago`;
  }
  
  return {
    exact: exactTime,
    relative: timeAgo,
    isRecent: diffInMinutes < 60 // For styling recent posts
  };
};

const getDetailedTimeDisplay = (dateString) => {
  const date = new Date(dateString);
  
  return {
    // Full detailed format
    full: date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }),
    
    // Compact format
    compact: date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    
    // Time only
    timeOnly: date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    
    // Date only
    dateOnly: date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    
    // ISO format for tooltips
    iso: date.toISOString(),
    
    // Relative time
    relative: formatExactTime(dateString).relative
  };
};
