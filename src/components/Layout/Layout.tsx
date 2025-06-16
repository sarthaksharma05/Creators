import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Sidebar - Only visible when open, no space reserved */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content area - ALWAYS takes full width */}
      <div className="flex-1 flex flex-col w-full min-w-0 relative">
        {/* Header with ULTRA-high z-index and fixed positioning for fullscreen */}
        <div 
          style={{ 
            zIndex: 999999,
            position: 'sticky',
            top: 0,
            width: '100%'
          }}
        >
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        
        {/* Main content - Full width always */}
        <main className="flex-1 overflow-y-auto relative w-full" style={{ zIndex: 1 }}>
          <div className="p-4 lg:p-6 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}