import React, { useState, useEffect, memo, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../hooks/useProgress';
import { TypeAnimation } from 'react-type-animation';
import Footer from '../Common/Footer';
import AOS from 'aos';
import 'aos/dist/aos.css';
// import profileImg from '../../../public/alphaprofile.jpg'; // Ensure you have a profile image in assets
import { IoDiamond } from "react-icons/io5";
import { SiInstructure } from "react-icons/si";
import { 
  Github, 
  Linkedin, 
  Instagram, 
  Mail, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  Code, 
  Award, 
  Globe, 
  ArrowUpRight, 
  User,
  Calendar
} from 'lucide-react';
import {
  FaRocket, 
  FaChartLine, 
  FaCertificate, 
  FaUsers, 
  FaArrowRight, 
  FaPlay,
  FaCode as FaCodeIcon,
  FaBrain, 
  FaStar, 
  FaTrophy
} from 'react-icons/fa';

// Constants
const TYPING_SPEED = 100;
const ERASING_SPEED = 50;
const PAUSE_DURATION = 2000;
const WORDS = ["Precision over speed", "Structure defines success", "Practice beats talent"];

// Updated shorter code snippets for compact display
const CODE_SNIPPETS = [
  {
    language: 'C++',
    code: `#include <iostream>
          using namespace std;
          int main() {
          cout << "Hello Welcome Back to AlphaKnowledge!";
          return 0;
}`
  },
  {
    language: 'Java',
    code: `public class Alpha {
           public static void main(String[] args) {
          System.out.println("Hello Welcome Back to AlphaKnowledge!");
    }
}`
  },
  {
    language: 'Python',
    code: `# Alpha Knowledge
def greet():
    print("Hello Welcome Back to AlphaKnowledge!")
greet()`
  }
];

// Memoized Components
const StatusBadge = memo(() => (
  <div className="inline-block animate-float mt-5" data-aos="zoom-in" data-aos-delay="400">
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
      <div className="relative px-4 py-2 rounded-full bg-blue-50/90 dark:bg-black/40 backdrop-blur-xl border border-blue-200 dark:border-white/10">
        <span className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-transparent bg-clip-text text-sm font-medium flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
          Master DSA with Alpha Knowledge
        </span>
      </div>
    </div>
  </div>
));

const MainTitle = memo(() => (
  <div className="space-y-2 mt-5" data-aos="fade-up" data-aos-delay="600">
    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
      <span className="relative inline-block">
        <span className="absolute -inset-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] blur-2xl opacity-20"></span>
        <span className="relative bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-100 dark:to-purple-200 bg-clip-text text-transparent">
          Master Data
        </span>
      </span>
      <br />
      <span className="relative inline-block mt-2">
        <span className="absolute -inset-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] blur-2xl opacity-20"></span>
        <span className="relative bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
          Structures & Algorithms
        </span>
      </span>
    </h1>
  </div>
));

// Minimal CTA Button
const CTAButton = memo(({ onClick, text, icon: Icon, variant = 'primary' }) => (
  <button 
    onClick={onClick}
    className={`inline-flex mt-5 items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
      variant === 'primary' 
        ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white hover:from-[#5855eb] hover:to-[#9333ea] shadow-lg hover:shadow-xl'
        : 'bg-white/10 text-gray-900 dark:text-white border border-white/20 hover:bg-white/20 shadow-sm hover:shadow-md backdrop-blur-sm'
    }`}
  >
    <span>{text}</span>
    <Icon className="w-4 h-4" />
  </button>
));

// Enhanced Code Block Component - FIXED language synchronization
const CodeBlock = memo(() => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedLanguage, setDisplayedLanguage] = useState(CODE_SNIPPETS[0].language);
  const [animationKey, setAnimationKey] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef(null);
  const cardRef = useRef(null);

  // Mouse spotlight effect
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  // FIXED: Update language immediately when currentIndex changes
  useEffect(() => {
    setDisplayedLanguage(CODE_SNIPPETS[currentIndex].language);
  }, [currentIndex]);

  // Rotate through code snippets only after full execution
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % CODE_SNIPPETS.length);
      setAnimationKey(prev => prev + 1); // Force TypeAnimation re-mount
    }, 8000); // 10 seconds - allows full typing + display time

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative mt-5 max-w-lg min-h-[380px] mx-auto bg-white/5 dark:bg-black/40 backdrop-blur-xl rounded-2xl px-8 py-10 shadow-xl border border-white/10 overflow-visible cursor-pointer group transition-all duration-700 ease-out z-10"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
        background: `
          radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.15), transparent 50%),
          radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1), transparent 70%),
          radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.1), transparent 70%),
          rgba(255, 255, 255, 0.05)
        `,
        transform: isHovered 
          ? 'translateX(6px) translateY(-6px) scale(1.02)' 
          : 'translateX(0) translateY(0) scale(1)',
        zIndex: isHovered ? 20 : 10,
        opacity: 1,
        visibility: 'visible',
        boxShadow: isHovered 
          ? '0 20px 40px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          : '0 8px 20px rgba(0, 0, 0, 0.15)',
      }}
      data-aos="fade-left" 
      data-aos-delay="800"
    >
      {/* Animated border glow */}
      <div 
        className={`absolute inset-0 rounded-2xl transition-opacity duration-700 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: -1 }}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#6366f1]/20 to-[#a855f7]/20 animate-pulse"></div>
      </div>

      {/* Floating particles effect */}
      <div className={`absolute top-3 right-6 w-1.5 h-1.5 bg-[#6366f1] rounded-full transition-all duration-1000 ${
        isHovered ? 'opacity-100 animate-bounce' : 'opacity-60'
      }`}></div>
      <div className={`absolute bottom-6 left-8 w-1 h-1 bg-[#a855f7] rounded-full transition-all duration-1000 ${
        isHovered ? 'opacity-80 animate-pulse' : 'opacity-40'
      }`}></div>
      <div className={`absolute top-1/2 right-12 w-1 h-1 bg-blue-400 rounded-full transition-all duration-1000 ${
        isHovered ? 'opacity-100 animate-ping' : 'opacity-50'
      }`}></div>

      {/* Header - FIXED language display with smooth transition */}
      <div className="relative flex items-center justify-between mb-4 z-20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></div>
          <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full shadow-sm"></div>
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></div>
          <span className="ml-3 text-xs font-semibold text-gray-900 dark:text-white bg-white/10 dark:bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-300">
            {displayedLanguage}
          </span>
        </div>
        <div className="w-5 h-5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-md flex items-center justify-center">
          <Code className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
      
      {/* Line numbers and code - Compact layout */}
      <div className="relative flex z-20">
        <div className="flex flex-col text-gray-400 dark:text-gray-500 text-xs font-mono select-none mr-3 pt-0.5 border-r border-white/10 pr-3">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="leading-5 opacity-60">{i + 1}</span>
          ))}
        </div>
        
        {/* Code content with TypeAnimation */}
        <div className="flex-1 text-gray-900 dark:text-white text-xs font-mono leading-5 overflow-x-auto">
          <TypeAnimation
            key={`${animationKey}-${currentIndex}`}
            sequence={[
              CODE_SNIPPETS[currentIndex].code,
              8000, // Hold for 8 seconds after typing completes
            ]}
            speed={60}
            repeat={Infinity}
            omitDeletionAnimation={true}
            cursor={true}
            wrapper="span"
            style={{
              whiteSpace: "pre-line",
              display: "block",
              fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace",
              opacity: 1,
              visibility: 'visible'
            }}
          />
        </div>
      </div>

      {/* Bottom decorative elements - Compact */}
      <div className={`absolute bottom-3 right-3 transition-opacity duration-500 z-20 ${
        isHovered ? 'opacity-70' : 'opacity-30'
      }`}>
        <div className="flex items-center gap-1.5 text-xs text-white/60">
          <div className="w-1.5 h-1.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full animate-pulse"></div>
          <span className="text-xs">Alpha</span>
        </div>
      </div>
    </div>
  );
});

const ProfileImage = memo(() => (
  <div className="flex justify-center items-center p-8">
    <div className="relative group">
      {/* Background Glow Effects (OUTSIDE the profile circle only) */}
      <div className="absolute -inset-12 opacity-25 z-0 hidden sm:block pointer-events-none">
        <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -inset-4 bg-gradient-to-l from-fuchsia-500 via-rose-500 to-pink-600 rounded-full blur-3xl animate-pulse opacity-40" />
      </div>

      {/* Profile Container with Tagline */}
      <div className="flex flex-col items-center">
        {/* Profile Image */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-2xl transform transition-all duration-700 group-hover:scale-105 z-10">
          {/* Optional glowing border */}
          <div className="absolute inset-0 border-4 border-white/20 dark:border-white/20 rounded-full z-10 transition-all duration-700 group-hover:border-white/40 group-hover:scale-105" />
          
          {/* ✅ Profile Image */}
          <img
            src="/alphaprofile.png"
            alt="Profile"
            className="w-full h-full object-cover object-center rounded-full"
          />
        </div>

        {/* ✅ Code | Compete | Conquer Tagline - Increased size and spacing */}
        <div 
          className="mt-6 text-center text-base md:text-lg font-light tracking-wide text-slate-700 dark:text-slate-300 transition-colors duration-300"
          data-aos="fade-up" 
          data-aos-delay="300"
        >
          Code | Compete | Conquer
        </div>
      </div>
    </div>
  </div>
));



const StatCard = memo(({ icon: Icon, color, value, label, description, animation }) => (
  <div data-aos={animation} data-aos-duration="1300" className="relative group">
    <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl h-full flex flex-col justify-between">
      <div className={`absolute -z-10 inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10 transition-transform group-hover:rotate-6">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <span className="text-4xl font-bold text-white" data-aos="fade-up-left" data-aos-duration="1500">
          {value}
        </span>
      </div>
      <div>
        <p className="text-sm uppercase tracking-wider text-gray-300 mb-2" data-aos="fade-up" data-aos-duration="800">
          {label}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400" data-aos="fade-up" data-aos-duration="1000">
            {description}
          </p>
          <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  </div>
));

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats } = useProgress();

  // State management
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Features data with icons
  const features = [
    {
      icon: FaRocket,
      title: 'Comprehensive DSA Coverage',
      description: 'Master data structures and algorithms with our carefully curated problem sets covering all important topics.',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: FaChartLine,
      title: 'Progress Tracking',
      description: 'Track your learning journey with detailed analytics and progress visualization across different difficulty levels.',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: IoDiamond,
      title: 'Quality Content',
      description: 'Access high-quality problems with detailed editorials, video solutions, and comprehensive notes.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: SiInstructure,
      title: 'Structured Learning',
      description: 'Follow our structured approach to learning DSA with organized sheets and progressive difficulty levels.',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  // About section stats
  const statsData = useMemo(() => [
    {
      icon: Code,
      color: "from-[#6366f1] to-[#a855f7]",
      value: "50+",
      label: "Practice Problems",
      description: "Curated DSA challenges",
      animation: "fade-right",
    },
    {
      icon: Award,
      color: "from-[#a855f7] to-[#6366f1]",
      value: "10+",
      label: "Topic Categories",
      description: "Comprehensive coverage",
      animation: "fade-up",
    },
    {
      icon: Globe,
      color: "from-[#6366f1] to-[#a855f7]",
      value: "24/7",
      label: "Learning Access",
      description: "Continuous improvement",
      animation: "fade-left",
    },
  ], []);

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      once: true,
      offset: 10,
    });
    window.addEventListener('resize', () => AOS.refresh());
  }, []);

  useEffect(() => {
    setIsLoaded(true);
    return () => setIsLoaded(false);
  }, []);

  // Typing effect
  const handleTyping = useCallback(() => {
    if (isTyping) {
      if (charIndex < WORDS[wordIndex].length) {
        setText(prev => prev + WORDS[wordIndex][charIndex]);
        setCharIndex(prev => prev + 1);
      } else {
        setTimeout(() => setIsTyping(false), PAUSE_DURATION);
      }
    } else {
      if (charIndex > 0) {
        setText(prev => prev.slice(0, -1));
        setCharIndex(prev => prev - 1);
      } else {
        setWordIndex(prev => (prev + 1) % WORDS.length);
        setIsTyping(true);
      }
    }
  }, [charIndex, isTyping, wordIndex]);

  useEffect(() => {
    const timeout = setTimeout(handleTyping, isTyping ? TYPING_SPEED : ERASING_SPEED);
    return () => clearTimeout(timeout);
  }, [handleTyping, isTyping]);

  const handleGetStarted = () => {
    navigate('/sheets');
  };

  return (
    <>
    <div className="min-h-screen bg-white dark:bg-[#030014]">
      
      <div className={`relative z-10 transition-all duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
        
        {/* Hero Section - Reduced top spacing */}
        <section className="relative pt-8 pb-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#030014]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              
              {/* Hero Content */}
              <div className="text-center lg:text-left space-y-6" data-aos="fade-right" data-aos-delay="200">
                <div className="space-y-4">
                  <StatusBadge />
                  <MainTitle />
                  
                  {/* Typing Effect */}
                  <div className="h-8 flex items-center justify-center lg:justify-start" data-aos="fade-up" data-aos-delay="800">
                    <span className="text-xl md:text-2xl bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent font-light">
                      {text}
                    </span>
                    <span className="w-[3px] h-6 bg-gradient-to-t from-[#6366f1] to-[#a855f7] ml-1 animate-pulse"></span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed font-light mx-auto lg:mx-0" data-aos="fade-up" data-aos-delay="1000">
                    Your comprehensive platform for learning DSA through structured problem-solving, 
                    detailed explanations, and progress tracking. Start your journey to coding excellence today.
                  </p>
                  
                  {/* Minimal CTA Buttons
                  <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start" data-aos="fade-up" data-aos-delay="1400">
                    <CTAButton onClick={handleGetStarted} text={user ? 'Continue Learning' : 'Get Started'} icon={FaPlay} />
                    {!user && (
                      <CTAButton onClick={() => navigate('/sheets')} text="Browse Sheets" icon={FaArrowRight} variant="secondary" />
                    )}
                  </div> */}
                  {/* Minimal CTA Buttons */}
<div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start" data-aos="fade-up" data-aos-delay="1400">
  <div className="text-sm px-3 py-1.5 sm:text-base sm:px-5 sm:py-3 inline-block">
    <CTAButton 
      onClick={handleGetStarted} 
      text={user ? 'Continue Learning' : 'Get Started'} 
      icon={FaPlay} 
    />
  </div>
  {/* {!user && (
    <CTAButton 
      onClick={() => navigate('/sheets')} 
      text="Browse Sheets" 
      icon={FaArrowRight} 
      variant="secondary" 
    />
  )} */}
</div>

                </div>
              </div>

              {/* Enhanced Code Block Animation */}
              <div className="lg:order-2">
                <CodeBlock />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section - Light/Dark Theme */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#030014]">
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6" data-aos="fade-up">
        Why Choose Alpha Knowledge?
      </h2>
      <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto" data-aos="fade-up" data-aos-delay="200">
        Everything you need to excel in data structures and algorithms
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div key={index} className="group" data-aos="fade-up" data-aos-delay={index * 100}>
            <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 dark:border-white/10 transition-all duration-300 hover:shadow-2xl hover:scale-105 relative overflow-hidden h-48">
              
              {/* Card hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 to-[#a855f7]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Enhanced Icon Container */}
              <div className="relative w-12 h-12 mb-3 group-hover:scale-110 transition-transform duration-300">
                {/* Multiple gradient layers for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-[#a855f7] to-[#6366f1] rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
                
                {/* Icon background */}
                <div className="relative w-full h-full bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 dark:border-white/20 shadow-lg">
                  <Icon className="w-6 h-6 text-[#6366f1] dark:text-[#a855f7] relative z-10 group-hover:scale-110 transition-transform duration-300" />
                </div>
                
                {/* Floating particles effect */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#6366f1] rounded-full opacity-0 group-hover:opacity-60 transition-all duration-300 group-hover:animate-pulse"></div>
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-[#a855f7] rounded-full opacity-0 group-hover:opacity-40 transition-all duration-300 group-hover:animate-bounce"></div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 relative z-10">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed relative z-10 line-clamp-3">
                {feature.description}
              </p>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6366f1] to-[#a855f7] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl"></div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</section>



        {/* UPDATED: About Section - Compact with no extra spacing */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gradient-to-br dark:from-[#030014] dark:via-gray-900 dark:to-purple-900 text-gray-900 dark:text-white" id="about">
  <div className="max-w-7xl mx-auto">
    
    {/* About Header */}
    <div className="text-center mb-12">
      <div className="inline-block relative group">
        <h2 
          className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#a855f7]" 
          data-aos="zoom-in-up"
          data-aos-duration="600"
        >
          About The Instructor
        </h2>
      </div>
      <p 
        className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-base sm:text-lg flex items-center justify-center gap-2"
        data-aos="zoom-in-up"
        data-aos-duration="800"
      >
        <Sparkles className="w-5 h-5 text-[#6366f1] dark:text-purple-400" />
        Transforming coding education through structured learning
        <Sparkles className="w-5 h-5 text-[#a855f7] dark:text-purple-400" />
      </p>
    </div>

    {/* About Content - Reorganized for mobile */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      
      {/* About Content */}
      <div className="space-y-6 text-center lg:text-left order-1 lg:order-1">
        <h3 
          className="text-3xl sm:text-4xl font-bold"
          data-aos="fade-right"
          data-aos-duration="1000"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
            Hey, all I am
          </span>
          <span 
            className="block mt-2 text-gray-800 dark:text-gray-200"
            data-aos="fade-right"
            data-aos-duration="1300"
          >
            Akash
          </span>
        </h3>
        
        <p 
          className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed"
          data-aos="fade-right"
          data-aos-duration="1500"
        >
          I am a passionate educator dedicated to making Data Structures and Algorithms 
          accessible to everyone. Our platform provides a structured approach to learning DSA through 
          carefully curated problems, detailed explanations, and comprehensive progress tracking.
        </p>

        {/* Profile Image - Shows after passionate text on mobile */}
        <div className="block lg:hidden order-2">
          <ProfileImage />
        </div>

        {/* Mission Statement - Glassy Background for Dark Theme */}
        <div 
          className="relative bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 dark:shadow-2xl rounded-2xl p-6 order-3"
          data-aos="fade-up"
          data-aos-duration="1700"
        >
          <div className="absolute top-3 left-4 text-[#6366f1] dark:text-[#6366f1] opacity-30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
            </svg>
          </div>
          <blockquote className="text-gray-700 dark:text-white text-center lg:text-left italic font-medium pl-6">
            "Making complex algorithms simple through structured learning and practical application."
          </blockquote>
        </div>

        {/* CTA Buttons - Faster loading */}
        <div 
          className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start order-4" 
          data-aos="fade-up" 
          data-aos-delay="200"
          data-aos-duration="600"
        >
          <CTAButton onClick={handleGetStarted} text="Start Learning" icon={FaRocket} />
          <CTAButton onClick={() => navigate('/contact')} text="Contact Us" icon={Mail} variant="secondary" />
        </div>
      </div>

      {/* Profile/Team Image - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block order-2 lg:order-2">
        <ProfileImage />
      </div>
    </div>

    {/* Statistics section remains commented out as in original */}
    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statsData.map((stat, index) => (
        // ... statistics content
      ))}
    </div> */}
  </div>
</section>

        {/* CTA Section - Light Theme */}
        
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
    <Footer />
    </>
  );
};

export default memo(Home);

