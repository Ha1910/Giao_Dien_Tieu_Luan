import React from 'react';
import {
    Film, Sofa, Home, Users, Ticket,
    BarChart3, Package, Tag, MessageSquare
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isOpen }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'movies', label: 'Quản Lý Phim', icon: Film },
        { id: 'rooms', label: 'Quản Lý Phòng & Ghế', icon: Sofa },
        { id: 'showtimes', label: 'Quản Lý Suất Chiếu', icon: Ticket },
        { id: 'users', label: 'Quản Lý Người Dùng', icon: Users },
        { id: 'combos', label: 'Quản Lý Combo', icon: Package },
        { id: 'promotions', label: 'Quản Lý Khuyến Mãi', icon: Tag },
        { id: 'reviews', label: 'Quản Lý Đánh Giá', icon: MessageSquare },
        { id: 'tickets', label: 'Quản Lý Vé', icon: Ticket },
        { id: 'reports', label: 'Báo Cáo & Thống Kê', icon: BarChart3 },

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
                    <p className="text-sm text-gray-500 mt-1">Cinema Management</p>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`
                                    w-full flex items-center px-4 py-3 text-left rounded-lg
                                    transition-all duration-200
                                    ${activeTab === item.id
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                                    focus:outline-none focus:ring-2 focus:ring-purple-300
                                `}
                            >
                                <Icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? 'text-white' : 'text-gray-500'}`} />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User info */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">A</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                            <p className="text-xs text-gray-500 truncate">Quản trị viên</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;