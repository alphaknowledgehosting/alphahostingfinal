import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, initialized, loading } = useAuth();

  useEffect(() => {
    // Wait for auth context to initialize
    if (initialized && !loading) {
      const success = searchParams.get('success');
      const storedPath = sessionStorage.getItem('loginReturnPath');
      
      if (success === 'true' && user) {
        // Successfully authenticated
        const returnPath = storedPath || '/';
        sessionStorage.removeItem('loginReturnPath');
        navigate(returnPath, { replace: true });
      } else if (success === 'false') {
        // Authentication failed
        sessionStorage.removeItem('loginReturnPath');
        navigate('/', { replace: true });
      } else if (user) {
        // User exists but no success param
        const returnPath = storedPath || '/';
        sessionStorage.removeItem('loginReturnPath');
        navigate(returnPath, { replace: true });
      } else {
        // No user, wait briefly then redirect
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      }
    }
  }, [user, initialized, loading, searchParams, navigate]);

  // **MINIMAL UI** - Just a blank page with subtle loading
  return (
    <div className="min-h-screen bg-white dark:bg-[#030014]">
      {/* Minimal loading indicator */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin opacity-50"></div>
      </div>
    </div>
  );
};

export default OAuthCallback;
