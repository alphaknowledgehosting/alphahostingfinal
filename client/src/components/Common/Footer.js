import React from 'react';
import { Heart, Code, Github, Linkedin, Instagram, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Github, url: 'https://github.com/alphaknowledge', label: 'GitHub' },
    { icon: Linkedin, url: 'https://linkedin.com/company/alphaknowledge', label: 'LinkedIn' },
    { icon: Instagram, url: 'https://instagram.com/alphaknowledge', label: 'Instagram' },
    { icon: Mail, url: 'mailto:contact@alphaknowledge.com', label: 'Email' }
  ];

  return (
    <footer className="bg-white dark:bg-[#030014] border-t border-gray-200/50 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center space-y-4">
          
          {/* Social Links */}
          <div className="flex items-center space-x-4">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                  aria-label={social.label}
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full blur opacity-0 group-hover:opacity-30 transition duration-300" />
                  <div className="relative p-2 bg-gray-100 dark:bg-white/10 backdrop-blur-sm rounded-full border border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-400 hover:text-[#6366f1] dark:hover:text-[#a855f7] transition-all duration-300 transform hover:scale-110">
                    <Icon className="w-4 h-4" />
                  </div>
                </a>
              );
            })}
          </div>

          {/* Copyright & Brand */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 animate-pulse" /> by 
              <span className="font-semibold bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
                Alpha Knowledge
              </span>
            </p>
            <span className="hidden sm:inline text-gray-400 dark:text-gray-600">•</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} All rights reserved
            </p>
          </div>

          {/* Tagline */}
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center max-w-md">
            Code | Compete | Conquer
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
