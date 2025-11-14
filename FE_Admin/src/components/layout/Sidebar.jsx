// components/layout/Sidebar.jsx
import React from 'react';
import { Film, Sofa, Home, Settings, Users, Ticket, BarChart3 } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isOpen }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'movies', label: 'Quản Lý Phim', icon: Film },
        { id: 'rooms', label: 'Quản Lý Phòng & Ghế', icon: Sofa },
        { id: 'showtimes', label: 'Lịch Chiếu', icon: Ticket },
        { id: 'users', label: 'Quản Lý Người Dùng', icon: Users },
        { id: 'reports', label: 'Báo Cáo & Thống Kê', icon: BarChart3 },
        { id: 'settings', label: 'Cài Đặt', icon: Settings },
    ];

    return (
        <div className={`
            bg-white shadow-lg transform transition-all duration-300 ease-in-out
            ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}
            lg:w-64 lg:translate-x-0
            fixed lg:static top-0 left-0 h-full z-40 overflow-y-auto
        `}>
            <div className="p-6">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
                </div>

                <nav className="space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`
                                    w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200
                                    ${activeTab === item.id
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default Sidebar;