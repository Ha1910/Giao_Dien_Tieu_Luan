// components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Users, Film, Sofa, DollarSign, TrendingUp, Calendar, Plus, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMovieModal, setShowMovieModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state for adding movie
    const [formData, setFormData] = useState({
        title: '',
        genre: '',
        duration: '',
        description: '',
        releaseDate: ''
    });

    const API_BASE_URL = 'http://localhost:8080';

    // Format currency VND
    const formatCurrency = (amount) => {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(0)}K`;
        }
        return amount.toString();
    };

    // Get auth token from localStorage
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    // Config axios với auth header
    const getAuthConfig = () => {
        const token = getAuthToken();
        return token ? {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        } : {};
    };

    // Create movie
    const createMovie = async (movieData) => {
        setModalLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/api/movies`, movieData, getAuthConfig());
            setSuccess('Thêm phim thành công!');
            closeMovieModal();
            // Refresh dashboard data
            fetchDashboardData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Lỗi khi thêm phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // Handle movie form submit
    const handleMovieSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.title.trim()) {
            setError('Vui lòng nhập tên phim!');
            return;
        }

        if (!formData.duration || parseInt(formData.duration) <= 0) {
            setError('Vui lòng nhập thời lượng hợp lệ!');
            return;
        }

        const submitData = {
            title: formData.title.trim(),
            genre: formData.genre || '',
            duration: parseInt(formData.duration),
            description: formData.description || '',
            releaseDate: formData.releaseDate || ''
        };

        await createMovie(submitData);
    };

    const openMovieModal = () => {
        setFormData({
            title: '',
            genre: '',
            duration: '',
            description: '',
            releaseDate: ''
        });
        setShowMovieModal(true);
        setError('');
    };

    const closeMovieModal = () => {
        setShowMovieModal(false);
        setFormData({ title: '', genre: '', duration: '', description: '', releaseDate: '' });
        setError('');
    };

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = getAuthToken();
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                };

                // Fetch all data in parallel
                const [moviesRes, roomsRes, statsRes, usersRes, showtimesRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/movies`, { headers }).catch(() => null),
                    fetch(`${API_BASE_URL}/api/rooms/api/rooms`, { headers }).catch(() => null),
                    token ? fetch(`${API_BASE_URL}/api/admin/statistics/daily`, { headers }).catch(() => null) : null,
                    token ? fetch(`${API_BASE_URL}/api/admin/users`, { headers }).catch(() => null) : null,
                    fetch(`${API_BASE_URL}/api/showtimes`, { headers }).catch(() => null)
                ]);

                // Parse responses
                const movies = moviesRes?.ok ? await moviesRes.json() : [];
                const rooms = roomsRes?.ok ? await roomsRes.json() : [];
                const dailyStats = statsRes?.ok ? await statsRes.json() : { ticketsSoldToday: 0, todayRevenue: 0 };
                const users = usersRes?.ok ? await usersRes.json() : [];
                const showtimes = showtimesRes?.ok ? await showtimesRes.json() : [];

                // Update stats
                setStats({
                    totalMovies: movies.length,
                    totalRooms: rooms.length,
                    todayRevenue: dailyStats.todayRevenue || 0,
                    ticketsSoldToday: dailyStats.ticketsSoldToday || 0,
                    totalUsers: users.length
                });

                // Create recent activities from showtimes (latest 4)
                const activities = showtimes.slice(0, 4).map((showtime) => ({
                    id: showtime.showtimeID,
                    action: 'Suất chiếu',
                    target: `${showtime.startTime || 'N/A'} - ${showtime.movie?.title || 'N/A'}`,
                    time: `Phòng ${showtime.room?.roomName || 'N/A'} - ${showtime.showtimeDate || 'N/A'}`
                }));

                setRecentActivities(activities);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statsData = stats ? [
        {
            title: 'Tổng Phim',
            value: stats.totalMovies.toString(),
            icon: Film,
            color: 'bg-blue-500',
            change: `${stats.totalMovies} phim`,
            trend: 'up'
        },
        {
            title: 'Tổng Phòng',
            value: stats.totalRooms.toString(),
            icon: Sofa,
            color: 'bg-green-500',
            change: `${stats.totalRooms} phòng chiếu`,
            trend: 'up'
        },
        {
            title: 'Doanh Thu Hôm Nay',
            value: `${formatCurrency(stats.todayRevenue)}đ`,
            icon: DollarSign,
            color: 'bg-purple-500',
            change: `${stats.ticketsSoldToday} vé đã bán`,
            trend: 'up'
        },
        {
            title: 'Người Dùng',
            value: stats.totalUsers.toString(),
            icon: Users,
            color: 'bg-orange-500',
            change: `${stats.totalUsers} tài khoản`,
            trend: 'up'
        }
    ] : [];

    if (loading) {
        return (
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-600">Tổng quan về hệ thống rạp chiếu phim</p>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600">Tổng quan về hệ thống rạp chiếu phim</p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-lg flex items-center gap-3 text-red-700">
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError('')} className="text-xl font-bold hover:text-red-900">×</button>
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded-lg flex items-center gap-3 text-green-700">
                    <span className="flex-1">{success}</span>
                    <button onClick={() => setSuccess('')} className="text-xl font-bold hover:text-green-900">×</button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsData.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                                    <p className={`text-sm mt-1 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                        {stat.change}
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
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Lịch Chiếu Gần Đây</h3>
                    <div className="space-y-4">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">
                                            {activity.action}: <span className="text-purple-600">"{activity.target}"</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Chưa có lịch chiếu nào</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Thao Tác Nhanh</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/movies')}
                            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center cursor-pointer"
                        >
                            <Film className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <span className="text-sm font-medium text-blue-800">Thêm Phim Mới</span>
                        </button>
                        <button
                            onClick={() => navigate('/rooms')}
                            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center cursor-pointer"
                        >
                            <Sofa className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <span className="text-sm font-medium text-green-800">Tạo Phòng Mới</span>
                        </button>
                        <button
                            onClick={() => navigate('/showtimes')}
                            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center cursor-pointer"
                        >
                            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <span className="text-sm font-medium text-purple-800">Lịch Chiếu</span>
                        </button>
                        <button
                            onClick={() => navigate('/users')}
                            className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center cursor-pointer"
                        >
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