import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import LoginButton from '../Auth/LoginButton';
import {
  Sun,
  Moon,
  Menu,
  X,
  Home,
  List,
  Mail,
  User,
  Loader2,
  LogOut,
  Bell,
  building,
  Settings,
  ChevronDown,
  Compass,
  Code,
  Layout
} from 'lucide-react';

// Explore Dropdown Component
const ExploreDropdown = ({ onNavigate, isActive }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exploreItems = [
    { path: '/sheets', label: 'Sheets', icon: List },
    { path: '/compiler', label: 'Quick Compiler', icon: Code },
    { path: '/live-code-editor', label: 'WebDev Editor', icon: Layout },
  ];

  return (
    <div 
      ref={dropdownRef}
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={`group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
          isActive 
            ? 'text-[#6366f1] dark:text-[#a855f7]' 
            : 'text-gray-600 dark:text-gray-300 hover:text-[#6366f1] dark:hover:text-[#a855f7]'
        }`}
      >
        <span className="relative flex items-center gap-1">
          <Compass className="w-4 h-4" />
          <span>Explore</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          <span
            className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] transition-all duration-300 ${
              isActive ? 'w-full' : 'w-0 group-hover:w-full'
            }`}
          />
        </span>
      </button>

      <div
        className={`absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl transition-all duration-300 transform origin-top ${
          isOpen 
            ? 'opacity-100 visible translate-y-0 scale-100' 
            : 'opacity-0 invisible -translate-y-2 scale-95'
        }`}
        style={{ zIndex: 1000 }}
      >
        <div className="py-2">
          {exploreItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-[#6366f1] dark:hover:text-[#a855f7] transition-all duration-200"
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Admin Dropdown Component
const AdminDropdown = ({ onNavigate, isActive }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={dropdownRef}
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={`group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
          isActive 
            ? 'text-[#6366f1] dark:text-[#a855f7]' 
            : 'text-gray-600 dark:text-gray-300 hover:text-[#6366f1] dark:hover:text-[#a855f7]'
        }`}
      >
        <span className="relative flex items-center gap-1">
          <Settings className="w-4 h-4" />
          <span>Admin</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          <span
            className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] transition-all duration-300 ${
              isActive ? 'w-full' : 'w-0 group-hover:w-full'
            }`}
          />
        </span>
      </button>

      <div
        className={`absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl transition-all duration-300 transform origin-top ${
          isOpen 
            ? 'opacity-100 visible translate-y-0 scale-100' 
            : 'opacity-0 invisible -translate-y-2 scale-95'
        }`}
        style={{ zIndex: 1000 }}
      >
        <div className="py-2">
          {/* Create Editorial - Only for Admins */}
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  onNavigate('/create-editorial');
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-[#6366f1] dark:hover:text-[#a855f7] transition-all duration-200"
              >
                <FileEdit className="w-4 h-4" />
                <span className="font-medium">Create Editorial</span>
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            </>
          )}
          
          <button
            onClick={() => {
              onNavigate('/admin/users');
              setIsOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-[#6366f1] dark:hover:text-[#a855f7] transition-all duration-200"
          >
            <User className="w-4 h-4" />
            <span className="font-medium">Users</span>
          </button>
          
          <button
            onClick={() => {
              onNavigate('/admin/sheets');
              setIsOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-[#6366f1] dark:hover:text-[#a855f7] transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Manage Sheets</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// MOBILE Explore Accordion Component
const MobileExploreAccordion = ({ onNavigate, isInstructor, currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);

  const exploreItems = [
    { path: '/sheets', label: 'Sheets', icon: List },
    { path: '/compiler', label: 'Quick Compiler', icon: Code },
    { path: '/live-code-editor', label: 'WebDev Editor', icon: Layout },
    {path : '/jobs', label: 'Jobs', icon: Building2}
  ];

  const isExploreActive = exploreItems.some(item => currentPath.startsWith(item.path)) || 
                         (isInstructor && currentPath === '/create-editorial');

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium text-left transition-all duration-300 ${
          isExploreActive
            ? 'bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 text-[#6366f1] dark:text-[#a855f7] border-l-4 border-[#6366f1]'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Compass className={`w-5 h-5 ${isExploreActive ? 'text-[#6366f1] dark:text-[#a855f7]' : ''}`} />
          <span>Explore</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Accordion Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pl-4 space-y-1 py-1">
          {exploreItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-[#6366f1]/5 text-[#6366f1] dark:text-[#a855f7]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Create Editorial for Instructors */}
          {isInstructor && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
              <button
                onClick={() => onNavigate('/create-editorial')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                  currentPath === '/create-editorial'
                    ? 'bg-[#6366f1]/5 text-[#6366f1] dark:text-[#a855f7]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                <FileEdit className="w-4 h-4" />
                <span>Create Editorial</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// MOBILE Admin Accordion Component
const MobileAdminAccordion = ({ onNavigate, isAdmin, canManageUsers, canManageSheets, currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);

  const isAdminActive = currentPath.startsWith('/admin/') || (isAdmin && currentPath === '/create-editorial');

  if (!canManageUsers && !canManageSheets) return null;

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium text-left transition-all duration-300 ${
          isAdminActive
            ? 'bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 text-[#6366f1] dark:text-[#a855f7] border-l-4 border-[#6366f1]'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Settings className={`w-5 h-5 ${isAdminActive ? 'text-[#6366f1] dark:text-[#a855f7]' : ''}`} />
          <span>Admin</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Accordion Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pl-4 space-y-1 py-1">
          {/* Create Editorial for Admins */}
          {isAdmin && (
            <>
              <button
                onClick={() => onNavigate('/create-editorial')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                  currentPath === '/create-editorial'
                    ? 'bg-[#6366f1]/5 text-[#6366f1] dark:text-[#a855f7]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                <FileEdit className="w-4 h-4" />
                <span>Create Editorial</span>
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            </>
          )}

          {canManageUsers && (
            <button
              onClick={() => onNavigate('/admin/users')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                currentPath === '/admin/users'
                  ? 'bg-[#6366f1]/5 text-[#6366f1] dark:text-[#a855f7]'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Users</span>
            </button>
          )}

          {canManageSheets && (
            <button
              onClick={() => onNavigate('/admin/sheets')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                currentPath === '/admin/sheets'
                  ? 'bg-[#6366f1]/5 text-[#6366f1] dark:text-[#a855f7]'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Manage Sheets</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const { 
    user, 
    logout, 
    loading, 
    unreadCount,
    markAllAsRead,
    canManageUsers,
    canManageSheets
  } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [badgeCleared, setBadgeCleared] = useState(false);

  // REORDERED: Home → Announcements → Contact (Explore will be inserted separately)
  const baseNavigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/announcements', label: 'Announcements', icon: Bell },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  const exploreItems = [
    { path: '/sheets', label: 'Sheets', icon: List },
    { path: '/compiler', label: 'Quick Compiler', icon: Code },
    { path: '/live-code-editor', label: 'WebDev Editor', icon: Layout },
  ];

  // MOBILE: Home → Explore items → Announcements → Contact → Admin
  const mobileNavigationItems = [
    baseNavigationItems[0], // Home
    ...exploreItems, // Sheets, Quick Compiler, WebDev Editor
    baseNavigationItems[1], // Announcements
    baseNavigationItems[2], // Contact
    ...(user && canManageUsers ? [{ path: '/admin/users', label: 'Users', icon: User }] : []),
    ...(user && canManageSheets ? [{ path: '/admin/sheets', label: 'Manage', icon: Settings }] : [])
  ];

  const isAdminPathActive = location.pathname.startsWith('/admin/');
  const isExplorePathActive = ['/sheets', '/compiler', '/live-code-editor'].some(path => location.pathname.startsWith(path));

  // Badge clearing when visiting announcements
  useEffect(() => {
    if (user && location.pathname === '/announcements' && unreadCount > 0) {
      const timer = setTimeout(() => {
        markAllAsRead();
        setBadgeCleared(true);
        localStorage.setItem('announcementsBadgeCleared', 'true');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, user, markAllAsRead, unreadCount]);

  // Reset badge cleared state when leaving announcements page
  useEffect(() => {
    if (location.pathname !== '/announcements') {
      setBadgeCleared(false);
      localStorage.removeItem('announcementsBadgeCleared');
    }
  }, [location.pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setIsMobileMenuOpen(false);
  };

  const shouldShowBadge = user && unreadCount > 0 && !badgeCleared && location.pathname !== '/announcements';

  // Show loading spinner during auth initialization
  if (loading) {
    return (
      <header className="fixed w-full top-0 z-50 bg-white dark:bg-[#030014] border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16 lg:h-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#6366f1]" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading...</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header 
        className={`fixed w-full top-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-white/95 dark:bg-[#030014]/95 backdrop-blur-xl shadow-lg' 
            : isMobileMenuOpen
            ? 'bg-white dark:bg-[#030014] shadow-lg'
            : 'bg-transparent'
        } border-b border-gray-200/50 dark:border-gray-800/50`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer space-x-3 group relative z-60"
              onClick={() => handleNavigation('/')}
            >
              <img
                src="/alphalogo.png"
                alt="AlphaKnowledge Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-12 lg:h-12 object-contain"
              />
              <h1 
                className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent group-hover:from-[#5855eb] group-hover:to-[#9333ea] transition-all leading-tight"
                style={{ 
                  lineHeight: '1.2',
                  paddingBottom: '2px'
                }}
              >
                AlphaKnowledge
              </h1>
            </div>

            {/* Desktop Navigation - REORDERED: Home → Explore → Announcements → Contact → Admin */}
            <nav className="hidden md:flex">
              <ul className="flex items-center space-x-1">
                {/* Home */}
                <li key={baseNavigationItems[0].path}>
                  <button
                    onClick={() => handleNavigation(baseNavigationItems[0].path)}
                    className={`group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                      location.pathname === baseNavigationItems[0].path
                        ? 'text-[#6366f1] dark:text-[#a855f7]' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-[#6366f1] dark:hover:text-[#a855f7]'
                    }`}
                  >
                    <span className="relative flex items-center gap-1">
                      <div className="relative">
                        <Home className="w-4 h-4 m-0 p-0" />
                      </div>
                      <span>{baseNavigationItems[0].label}</span>
                      <span
                        className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] transition-all duration-300 ${
                          location.pathname === baseNavigationItems[0].path ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                      />
                    </span>
                  </button>
                </li>

                {/* Explore Dropdown */}
                <li>
                  <ExploreDropdown 
                    onNavigate={handleNavigation}
                    isActive={isExplorePathActive}
                  />
                </li>

                {/* Announcements */}
                <li key={baseNavigationItems[1].path}>
                  <button
                    onClick={() => handleNavigation(baseNavigationItems[1].path)}
                    className={`group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                      location.pathname === baseNavigationItems[1].path
                        ? 'text-[#6366f1] dark:text-[#a855f7]' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-[#6366f1] dark:hover:text-[#a855f7]'
                    }`}
                  >
                    <span className="relative flex items-center gap-1">
                      <div className="relative">
                        <Bell className="w-4 h-4 m-0 p-0" />
                        {shouldShowBadge && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span>{baseNavigationItems[1].label}</span>
                      <span
                        className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] transition-all duration-300 ${
                          location.pathname === baseNavigationItems[1].path ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                      />
                    </span>
                  </button>
                </li>

                {/* Contact */}
                <li key={baseNavigationItems[2].path}>
                  <button
                    onClick={() => handleNavigation(baseNavigationItems[2].path)}
                    className={`group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                      location.pathname === baseNavigationItems[2].path
                        ? 'text-[#6366f1] dark:text-[#a855f7]' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-[#6366f1] dark:hover:text-[#a855f7]'
                    }`}
                  >
                    <span className="relative flex items-center gap-1">
                      <div className="relative">
                        <Mail className="w-4 h-4 m-0 p-0" />
                      </div>
                      <span>{baseNavigationItems[2].label}</span>
                      <span
                        className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] transition-all duration-300 ${
                          location.pathname === baseNavigationItems[2].path ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                      />
                    </span>
                  </button>
                </li>
                
                {/* Admin Dropdown */}
                {user && (canManageUsers || canManageSheets) && (
                  <li>
                    <AdminDropdown 
                      onNavigate={handleNavigation}
                      isActive={isAdminPathActive}
                      isAdmin={isAdmin}
                    />
                  </li>
                )}
              </ul>
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-3 relative z-60">
              
              {/* Theme Toggle */}
              <button 
                className="p-2.5 text-[#6366f1] dark:text-[#a855f7] transition-all duration-200 transform hover:scale-110"
                onClick={toggleTheme}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* User Section - Desktop */}
              <div className="hidden md:flex items-center">
                {user ? (
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                    <img 
                      src={user.profilePicture} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#6366f1]/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Hello, {user.name.split(' ')[0]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                        {user.email}
                      </span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="ml-2 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all duration-200 disabled:opacity-50 group"
                      title="Logout"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      )}
                    </button>
                  </div>
                ) : (
                  <LoginButton 
                    variant="google" 
                    onLoginSuccess={handleLoginSuccess}
                  />
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden relative p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                <div className={`transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`}>
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </div>
                
                {!isMobileMenuOpen && shouldShowBadge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Overlay - WITH ACCORDION DROPDOWNS */}
        {isMobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              style={{ top: '64px' }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#030014] shadow-2xl border-t border-gray-200 dark:border-gray-800 z-50 md:hidden max-h-[calc(100vh-64px)] overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 py-6">
                
                <nav className="mb-6">
                  <ul className="space-y-2">
                    {mobileNavigationItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      const isAnnouncements = item.path === '/announcements';
                      
                      return (
                        <li key={item.path}>
                          <button
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-left transition-all duration-300 ${
                              isActive 
                                ? 'bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 text-[#6366f1] dark:text-[#a855f7] border-l-4 border-[#6366f1]' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                            }`}
                            onClick={() => handleNavigation(item.path)}
                            style={{
                              transitionDelay: `${index * 50}ms`,
                            }}
                          >
                            <div className="relative">
                              <Icon className={`w-5 h-5 ${isActive ? 'text-[#6366f1] dark:text-[#a855f7]' : ''}`} />
                              {isAnnouncements && shouldShowBadge && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                              )}
                            </div>
                            <span>{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Mobile Auth Section */}
                <div className="border-t border-gray-200 dark:border-white/10 pt-6">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <img 
                          src={user.profilePicture} 
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-[#6366f1]/20"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </div>
                        </div>
                        {shouldShowBadge && (
                          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                            {unreadCount} unread
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 disabled:opacity-50"
                      >
                        {isLoggingOut ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Signing out...</span>
                          </>
                        ) : (
                          <>
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <LoginButton 
                        variant="google" 
                        onLoginSuccess={handleLoginSuccess}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </header>
    </>
  );
};

export default Header;
