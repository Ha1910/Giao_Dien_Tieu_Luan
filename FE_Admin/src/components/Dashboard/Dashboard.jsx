import React, { useState, useEffect } from 'react';
import { Users, Film, Sofa, DollarSign, Calendar, Plus, Clock, X, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalMovies: 0,
        totalRooms: 0,
        todayRevenue: 0,
        ticketsSoldToday: 0,
        totalUsers: 0
    });
    const [roomsState, setRoomsState] = useState([]); // kept local rooms list
    const [recentShowtimes, setRecentShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMovieModal, setShowMovieModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [movieForm, setMovieForm] = useState({
        title: '',
        genre: '',
        duration: '',
        description: '',
        releaseDate: ''
    });

    const [roomForm, setRoomForm] = useState({
        roomName: '',
        capacity: '',
        roomType: 'STANDARD',
        description: ''
    });

    const API_BASE_URL = 'http://localhost:8080/api';

    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('authToken') || localStorage.getItem('token');
    };

    // Auth config
    const getAuthConfig = () => {
        const token = getAuthToken();
        return {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            }
        };
    };

    // Fetch all data từ API
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');

            // Add timestamp to avoid cache issues
            const ts = Date.now();
            const [moviesRes, roomsRes, usersRes, showtimesRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/movies?ts=${ts}`, getAuthConfig()),
                axios.get(`${API_BASE_URL}/rooms?ts=${ts}`, getAuthConfig()),
                axios.get(`${API_BASE_URL}/admin/users?ts=${ts}`, getAuthConfig()),
                axios.get(`${API_BASE_URL}/showtimes?ts=${ts}`, getAuthConfig())
            ]);

            console.log('API Responses:', {
                movies: moviesRes.data,
                rooms: roomsRes.data,
                users: usersRes.data,
                showtimes: showtimesRes.data
            });

            // Xử lý dữ liệu movies
            const moviesData = Array.isArray(moviesRes.data) ? moviesRes.data :
                moviesRes.data?.data || moviesRes.data?.content || [];

            // Xử lý dữ liệu rooms
            const roomsData = Array.isArray(roomsRes.data) ? roomsRes.data :
                roomsRes.data?.data || roomsRes.data?.content || [];

            // Xử lý dữ liệu users
            const usersData = Array.isArray(usersRes.data) ? usersRes.data :
                usersRes.data?.data || usersRes.data?.content || [];

            // Xử lý dữ liệu showtimes
            const showtimesData = Array.isArray(showtimesRes.data) ? showtimesRes.data :
                showtimesRes.data?.data || showtimesRes.data?.content || [];

            console.log('Parsed counts:', {
                movies: moviesData.length,
                rooms: roomsData.length,
                users: usersData.length,
                showtimes: showtimesData.length
            });

            // Cập nhật roomsState và stats
            setRoomsState(roomsData);
            setStats({
                totalMovies: moviesData.length || 0,
                totalRooms: roomsData.length || 0,
                todayRevenue: 0, // Có thể tính từ bookings nếu có API
                ticketsSoldToday: 0,
                totalUsers: usersData.length || 0
            });

            // Lấy 3 lịch chiếu gần nhất
            const sortedShowtimes = showtimesData
                .sort((a, b) => new Date(b.showtimeDate + 'T' + b.startTime) - new Date(a.showtimeDate + 'T' + a.startTime))
                .slice(0, 3);

            const recent = sortedShowtimes.map(st => ({
                id: st.showtimeID || st.id,
                movie: st.movie?.title || 'Unknown Movie',
                room: st.room?.roomName || 'Unknown Room',
                time: st.startTime,
                date: st.showtimeDate,
                price: st.basePrice
            }));

            setRecentShowtimes(recent);

        } catch (err) {
            console.error('Lỗi fetch dashboard data:', err);
            setError('Không thể tải dữ liệu: ' + (err.response?.data?.message || err.message));

            // Set data mặc định nếu API fail
            setRecentShowtimes([{
                id: 1,
                movie: 'Spider-Man: No Way Home',
                room: 'TH19',
                time: '14:00:00',
                date: '2025-11-24',
                price: 120000
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Tạo phim mới
    const createMovie = async (movieData) => {
        setModalLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/movies`, movieData, getAuthConfig());
            console.log('Movie created:', response.data);
            setSuccess('Thêm phim thành công!');
            closeMovieModal();
            await fetchDashboardData(); // Refresh data
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Lỗi tạo phim:', err);
            setError('Lỗi khi thêm phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // Tạo phòng mới
    const createRoom = async (roomData) => {
        setModalLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/rooms`, roomData, getAuthConfig());
            console.log('Room created response:', response);
            // Try several common response shapes
            let createdRoom = null;
            if (response.data) {
                // If API returns { data: {...} } or {...}
                createdRoom = response.data?.data || response.data;
            }

            setSuccess('Thêm phòng thành công!');
            closeRoomModal();

            // Optimistic + resilient update: if createdRoom is an object add it, else just refetch
            if (createdRoom && (typeof createdRoom === 'object') && !Array.isArray(createdRoom)) {
                setRoomsState(prev => [createdRoom, ...prev]);
                setStats(prev => ({ ...prev, totalRooms: (prev.totalRooms || 0) + 1 }));
            } else {
                // If server returns no object, still attempt to increment (best-effort) and refetch
                setStats(prev => ({ ...prev, totalRooms: (prev.totalRooms || 0) + 1 }));
            }

            // Refetch to ensure server-client consistency
            await fetchDashboardData();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Lỗi tạo phòng:', err);
            setError('Lỗi khi thêm phòng: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // Handle form submits
    const handleMovieSubmit = async (e) => {
        e.preventDefault();
        if (!movieForm.title.trim() || !movieForm.duration) {
            setError('Vui lòng nhập tên phim và thời lượng!');
            return;
        }

        const submitData = {
            title: movieForm.title.trim(),
            genre: movieForm.genre || 'Action',
            duration: parseInt(movieForm.duration, 10),
            description: movieForm.description || '',
            releaseDate: movieForm.releaseDate || new Date().toISOString().split('T')[0]
        };

        await createMovie(submitData);
    };

    const handleRoomSubmit = async (e) => {
        e.preventDefault();
        if (!roomForm.roomName.trim() || !roomForm.capacity) {
            setError('Vui lòng nhập tên phòng và sức chứa!');
            return;
        }

        const submitData = {
            roomName: roomForm.roomName.trim(),
            capacity: parseInt(roomForm.capacity, 10),
            roomType: roomForm.roomType,
            description: roomForm.description || ''
        };

        await createRoom(submitData);
    };

    // Modal handlers
    const openMovieModal = () => {
        setMovieForm({
            title: '',
            genre: '',
            duration: '',
            description: '',
            releaseDate: ''
        });
        setShowMovieModal(true);
        setError('');
    };

    const openRoomModal = () => {
        setRoomForm({
            roomName: '',
            capacity: '',
            roomType: 'STANDARD',
            description: ''
        });
        setShowRoomModal(true);
        setError('');
    };

    const closeMovieModal = () => {
        setShowMovieModal(false);
        setError('');
    };

    const closeRoomModal = () => {
        setShowRoomModal(false);
        setError('');
    };

    // Format functions
    const formatCurrency = (amount) => {
        if (!amount) return '0₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5); // HH:MM
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Fetch data khi component mount
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const statsData = [
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
            value: formatCurrency(stats.todayRevenue),
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
    ];

    if (loading) {
        return (
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-600">Tổng quan về hệ thống rạp chiếu phim</p>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="ml-4 text-gray-600">Đang tải dữ liệu từ server...</p>
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
                        <div key={index} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                                    <p className="text-sm text-green-500 mt-1">{stat.change}</p>
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
                {/* Recent Showtimes */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Lịch Chiếu Gần Đây
                    </h3>
                    <div className="space-y-4">
                        {recentShowtimes.map((showtime) => (
                            <div key={showtime.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg border-l-4 border-blue-500">
                                <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">
                                        {showtime.movie}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatTime(showtime.time)} • {formatDate(showtime.date)} • {showtime.room}
                                        {showtime.price && ` • ${formatCurrency(showtime.price)}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Thao Tác Nhanh</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={openMovieModal}
                            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center cursor-pointer border border-blue-200 hover:border-blue-300"
                        >
                            <Plus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <span className="text-sm font-medium text-blue-800">Thêm Phim Mới</span>
                        </button>
                        <button
                            onClick={openRoomModal}
                            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center cursor-pointer border border-green-200 hover:border-green-300"
                        >
                            <Sofa className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <span className="text-sm font-medium text-green-800">Tạo Phòng Mới</span>
                        </button>

                        {/* Use Link for navigation so it works even if click handlers are blocked */}
                        <Link
                            to="/showtimes"
                            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center cursor-pointer border border-purple-200 hover:border-purple-300"
                            onClick={() => console.log('Link clicked -> /showtimes')}
                        >
                            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <span className="text-sm font-medium text-purple-800">Lịch Chiếu</span>
                        </Link>

                        <Link
                            to="/users"
                            className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center cursor-pointer border border-orange-200 hover:border-orange-300"
                            onClick={() => console.log('Link clicked -> /users')}
                        >
                            <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <span className="text-sm font-medium text-orange-800">Quản Lý User</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Add Movie Modal */}
            {showMovieModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-semibold">Thêm Phim Mới</h3>
                            <button onClick={closeMovieModal} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleMovieSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên phim *
                                    </label>
                                    <input
                                        type="text"
                                        value={movieForm.title}
                                        onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập tên phim"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Thể loại
                                        </label>
                                        <input
                                            type="text"
                                            value={movieForm.genre}
                                            onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Thể loại"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Thời lượng (phút) *
                                        </label>
                                        <input
                                            type="number"
                                            value={movieForm.duration}
                                            onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="120"
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày phát hành
                                    </label>
                                    <input
                                        type="date"
                                        value={movieForm.releaseDate}
                                        onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả
                                    </label>
                                    <textarea
                                        value={movieForm.description}
                                        onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập mô tả phim"
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={closeMovieModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                                >
                                    {modalLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Thêm Phim
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Room Modal */}
            {showRoomModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-semibold">Tạo Phòng Mới</h3>
                            <button onClick={closeRoomModal} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRoomSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên phòng *
                                    </label>
                                    <input
                                        type="text"
                                        value={roomForm.roomName}
                                        onChange={(e) => setRoomForm({ ...roomForm, roomName: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                        placeholder="Nhập tên phòng"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Sức chứa *
                                        </label>
                                        <input
                                            type="number"
                                            value={roomForm.capacity}
                                            onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                            placeholder="100"
                                            min="1"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Loại phòng
                                        </label>
                                        <select
                                            value={roomForm.roomType}
                                            onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                        >
                                            <option value="STANDARD">Tiêu chuẩn</option>
                                            <option value="VIP">VIP</option>
                                            <option value="IMAX">IMAX</option>
                                            <option value="4DX">4DX</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả
                                    </label>
                                    <textarea
                                        value={roomForm.description}
                                        onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                        placeholder="Nhập mô tả phòng"
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={closeRoomModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                                >
                                    {modalLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Tạo Phòng
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;