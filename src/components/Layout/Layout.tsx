import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Sidebar with proper z-index */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-0 relative">
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
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto relative" style={{ zIndex: 1 }}>
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}