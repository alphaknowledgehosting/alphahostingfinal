import React, { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster, useToasterStore, toast } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';
import { 
  Home as HomeIcon, 
  AlertTriangle, 
  ArrowLeft, 
  Search,
  Code,
  Bug
} from 'lucide-react';

// Create a client with optimized settings for fast loading
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Lazy load components for better performance
const Home = lazy(() => import('./components/Pages/Home'));
const SheetList = lazy(() => import('./components/Content/SheetList'));
const SheetView = lazy(() => import('./components/Content/SheetView'));
const ContactUs = lazy(() => import('./components/Pages/ContactUs'));
const MainLayout = lazy(() => import('./components/Layout/MainLayout'));
const WelcomeScreen = lazy(() => import('./components/Pages/WelcomeScreen'));
const Announcements = lazy(() => import('./components/Pages/Announcements'));
const EditorialPage = lazy(() => import('./components/Pages/EditorialPage'));
const UserManagement = lazy(() => import('./components/Admin/UserManagement'));
const SheetManagement = lazy(() => import('./components/Admin/SheetManagement'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

// Custom hook to limit toasts to 1 - prevents stacking
function useLimitToasts(max = 1) {
  const { toasts } = useToasterStore();

  useEffect(() => {
    toasts
      .filter((t) => t.visible) // Only consider visible toasts
      .filter((_, i) => i >= max) // Is toast index over limit?
      .forEach((t) => toast.dismiss(t.id)); // Dismiss excess toasts
  }, [toasts, max]);
}

// Custom Toaster component that prevents stacking
function SingleToaster(props) {
  useLimitToasts(1); // Only allow 1 toast at a time
  return <Toaster {...props} />;
}

// Main App Component with Routing
function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    const welcomeShown = sessionStorage.getItem('welcomeShown');
    // Check if we're on editorial route - if so, don't show welcome
    const isEditorialRoute = window.location.pathname.startsWith('/editorial');
    return !welcomeShown && !isEditorialRoute;
  });

  const handleWelcomeComplete = () => {
    sessionStorage.setItem('welcomeShown', 'true');
    setShowWelcome(false);
  };

  // Don't show welcome screen for editorial routes
  if (showWelcome && !window.location.pathname.startsWith('/editorial')) {
    return (
      <Suspense fallback={<PageLoader />}>
        <WelcomeScreen onLoadingComplete={handleWelcomeComplete} />
      </Suspense>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <ThemeProvider>
          <Router>
            <AuthProvider>
              <ProgressProvider>
                {/* FIXED: Use SingleToaster that prevents stacking */}
                <SingleToaster
                  position="top-right"
                  reverseOrder={false}
                  gutter={8}
                  containerClassName=""
                  containerStyle={{
                    zIndex: 99999,
                    position: 'fixed',
                    top: '5rem', // Below header
                    right: '1rem',
                  }}
                  toastOptions={{
                    // Global defaults - ensure all toasts have proper duration
                    duration: 4000, // 4 seconds default
                    style: {
                      background: 'var(--toast-bg, #363636)',
                      color: 'var(--toast-color, #fff)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      fontSize: '13px',
                      minWidth: '200px',
                      maxWidth: '280px',
                      padding: '8px 12px',
                    },
                    // Success toasts - shorter duration
                    success: {
                      duration: 3000, // 3 seconds
                      style: {
                        background: 'var(--toast-success-bg, #10B981)',
                        color: 'var(--toast-success-color, #fff)',
                      },
                      iconTheme: {
                        primary: '#fff',
                        secondary: '#10B981',
                      },
                    },
                    // Error toasts - longer duration so user can read
                    error: {
                      duration: 5000, // 5 seconds
                      style: {
                        background: 'var(--toast-error-bg, #EF4444)',
                        color: 'var(--toast-error-color, #fff)',
                      },
                      iconTheme: {
                        primary: '#fff',
                        secondary: '#EF4444',
                      },
                    },
                    // Loading toasts - infinite duration, must be manually dismissed
                    loading: {
                      duration: Infinity,
                      style: {
                        background: 'var(--toast-loading-bg, #3B82F6)',
                        color: 'var(--toast-loading-color, #fff)',
                      },
                    },
                    // Blank toasts
                    blank: {
                      duration: 4000, // 4 seconds
                    },
                  }}
                />
                
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/announcements" element={<Announcements />} />
                    <Route path="/editorial/:problemId" element={<EditorialPageWrapper />} />
                    <Route path="/sheets" element={<SheetsPage />} />
                    <Route path="/sheet/:sheetId" element={<SheetDetailsPage />} />
                    <Route path="/contact" element={<ContactUsPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/sheets" element={<AdminSheetsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </ProgressProvider>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

// FIXED: Use the real EditorialPage component instead of placeholder
const EditorialPageWrapper = () => {
  return <EditorialPage />;
};

// Keep all your existing page components unchanged
const HomePage = React.memo(() => (
  <MainLayout>
    <Home />
  </MainLayout>
));

const AdminSheetsPage = React.memo(() => (
  <MainLayout>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SheetManagement />
    </div>
  </MainLayout>
));

const SheetsPage = React.memo(() => {
  const navigate = useNavigate();

  const handleSheetSelect = (sheetId) => {
    navigate(`/sheet/${sheetId}`);
  };

  return (
    <MainLayout>
      <SheetList onSheetSelect={handleSheetSelect} />
    </MainLayout>
  );
});

const SheetDetailsPage = React.memo(() => {
  const navigate = useNavigate();
  const { sheetId } = useParams();

  const handleBackToSheets = () => {
    navigate('/sheets');
  };

  return (
    <MainLayout>
      <SheetView 
        sheetId={sheetId} 
        onBack={handleBackToSheets} 
      />
    </MainLayout>
  );
});

const ContactUsPage = React.memo(() => (
  <MainLayout>
    <ContactUs />
  </MainLayout>
));

// Added AdminUsersPage component
const AdminUsersPage = React.memo(() => (
  <MainLayout>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <UserManagement />
    </div>
  </MainLayout>
));

// Your existing NotFoundPage component
const NotFoundPage = React.memo(() => {
  const navigate = useNavigate();
  
  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 sm:p-12">
            
            <div className="mb-8">
              <div className="relative">
                <div className="text-8xl sm:text-9xl font-bold text-gray-200 dark:text-gray-700 select-none">
                  404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center animate-bounce">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Oops! The page you're looking for seems to have wandered off into the digital void. 
              Don't worry, even the best algorithms sometimes take wrong turns.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Bug className="w-4 h-4 mr-2 text-blue-500" />
                What you can do:
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Check the URL for any typos</li>
                <li>• Go back to the previous page</li>
                <li>• Start fresh from our homepage</li>
                <li>• Browse our problem sheets</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
              >
                <HomeIcon className="w-4 h-4" />
                <span>Go Home</span>
              </button>
              
              <button 
                onClick={() => navigate('/sheets')}
                className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Code className="w-4 h-4" />
                <span>Browse Sheets</span>
              </button>
              
              <button 
                onClick={() => window.history.back()}
                className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium py-3 transition-colors duration-200"
              >
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
});

export default App;
