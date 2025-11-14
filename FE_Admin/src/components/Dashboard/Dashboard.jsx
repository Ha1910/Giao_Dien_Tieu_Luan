// components/Dashboard/Dashboard.jsx
import React from 'react';
import { Users, Film, Sofa, DollarSign, TrendingUp, Calendar } from 'lucide-react';

const Dashboard = () => {
    const stats = [
        {
            title: 'Tổng Phim',
            value: '45',
            icon: Film,
            color: 'bg-blue-500',
            change: '+12%',
            trend: 'up'
        },
        {
            title: 'Tổng Phòng',
            value: '8',
            icon: Sofa,
            color: 'bg-green-500',
            change: '+2',
            trend: 'up'
        },
        {
            title: 'Doanh Thu Hôm Nay',
            value: '12.5M',
            icon: DollarSign,
            color: 'bg-purple-500',
            change: '+8.5%',
            trend: 'up'
        },
        {
            title: 'Người Dùng',
            value: '1,234',
            icon: Users,
            color: 'bg-orange-500',
            change: '+5.2%',
            trend: 'up'
        }
    ];

    const recentActivities = [
        { id: 1, action: 'Phim mới được thêm', target: 'Avengers: Endgame', time: '5 phút trước' },
        { id: 2, action: 'Phòng được cập nhật', target: 'Phòng IMAX 1', time: '1 giờ trước' },
        { id: 3, action: 'Suất chiếu mới', target: '22:00 - Spider-Man', time: '2 giờ trước' },
        { id: 4, action: 'Người dùng mới đăng ký', target: 'Nguyễn Văn A', time: '3 giờ trước' },
    ];

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600">Tổng quan về hệ thống rạp chiếu phim</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                                    <p className={`text-sm mt-1 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                        {stat.change} so với tháng trước
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${stat.color} text-white`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Hoạt Động Gần Đây</h3>
                    <div className="space-y-4">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">
                                        {activity.action} <span className="text-purple-600">"{activity.target}"</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Thao Tác Nhanh</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center">
                            <Film className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <span className="text-sm font-medium text-blue-800">Thêm Phim Mới</span>
                        </button>
                        <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
                            <Sofa className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <span className="text-sm font-medium text-green-800">Tạo Phòng Mới</span>
                        </button>
                        <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
                            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <span className="text-sm font-medium text-purple-800">Lịch Chiếu</span>
                        </button>
                        <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center">
                            <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <span className="text-sm font-medium text-orange-800">Quản Lý User</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;