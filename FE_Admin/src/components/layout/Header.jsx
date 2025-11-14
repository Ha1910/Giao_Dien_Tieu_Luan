// components/layout/Header.jsx
import React, { useState } from 'react';
import { LogOut, User, Menu, X, Film, Sofa, Home, Settings } from 'lucide-react';

const Header = ({ user, handleLogout, onMenuToggle, isSidebarOpen }) => {
    return (
        <header className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left side - Logo and Menu button */}
                    <div className="flex items-center">
                        <button
                            onClick={onMenuToggle}
                            className="p-2 rounded-md text-white hover:bg-white/20 transition-colors"
                        >
                            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <div className="ml-4 flex items-center">
                            <Film className="w-8 h-8 text-white" />
                            <span className="ml-2 text-white text-xl font-bold">Cinema Admin</span>
                        </div>
                    </div>

                    {/* Right side - User info and logout */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-white">
                            <User className="w-5 h-5 mr-2" />
                            <span className="font-medium">{user?.name || 'Admin'}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 text-white bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;