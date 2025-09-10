import React from 'react';
import Header from '../Common/Header';
import Footer from '../Common/Footer';
const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="pt-16 lg:pt-20">
        {children}
      </main>
     
    </div>
  );
};

export default MainLayout;
