import React, { useState, useEffect } from 'react';
import { Users, Film, Sofa, DollarSign, Calendar, Plus, Clock, X, Save, Trash2, Edit2, Eye, EyeOff, AlertCircle, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalMovies: 0,
        totalRooms: 0,
        todayRevenue: 0,
        ticketsSoldToday: 0,
        totalUsers: 0,
        totalShowtimes: 0,
        totalCombos: 0
    });
    const [roomsState, setRoomsState] = useState([]);
    const [recentShowtimes, setRecentShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMovieModal, setShowMovieModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showShowtimeModal, setShowShowtimeModal] = useState(false);
    const [showComboModal, setShowComboModal] = useState(false);
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

    const [showtimeForm, setShowtimeForm] = useState({
        startTime: '',
        endTime: '',
        showtimeDate: '',
        description: '',
        basePrice: '',
        movieId: '',
        roomId: ''
    });

    const [comboForm, setComboForm] = useState({
        nameCombo: '',
        price: '',
        description: ''
    });

    const [movies, setMovies] = useState([]);
    const [rooms, setRooms] = useState([]);

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

            const ts = Date.now();
            const [moviesRes, roomsRes, usersRes, showtimesRes, combosRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/movies?ts=${ts}`, getAuthConfig()),
                axios.get(`${API_BASE_URL}/rooms?ts=${ts}`, getAuthConfig()),
                axios.get(`${API_BASE_URL}/admin/users?ts=${ts}`, getAuthConfig()),
                axios.get(`${API_BASE_URL}/showtimes?ts=${ts}`, getAuthConfig()),
                axios.get(`${API_BASE_URL}/combos?ts=${ts}`, getAuthConfig())
            ]);

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

            // Xử lý dữ liệu combos
            const combosData = Array.isArray(combosRes.data) ? combosRes.data :
                combosRes.data?.data || combosRes.data?.content || [];

            // Cập nhật state
            setMovies(moviesData);
            setRooms(roomsData);
            setRoomsState(roomsData);

            setStats({
                totalMovies: moviesData.length || 0,
                totalRooms: roomsData.length || 0,
                todayRevenue: 0,
                ticketsSoldToday: 0,
                totalUsers: usersData.length || 0,
                totalShowtimes: showtimesData.length || 0,
                totalCombos: combosData.length || 0
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
            await fetchDashboardData();
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

            let createdRoom = null;
            if (response.data) {
                createdRoom = response.data?.data || response.data;
            }

            setSuccess('Thêm phòng thành công!');
            closeRoomModal();

            if (createdRoom && (typeof createdRoom === 'object') && !Array.isArray(createdRoom)) {
                setRoomsState(prev => [createdRoom, ...prev]);
                setStats(prev => ({ ...prev, totalRooms: (prev.totalRooms || 0) + 1 }));
            } else {
                setStats(prev => ({ ...prev, totalRooms: (prev.totalRooms || 0) + 1 }));
            }

            await fetchDashboardData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Lỗi tạo phòng:', err);
            setError('Lỗi khi thêm phòng: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // Tạo lịch chiếu mới
    const createShowtime = async (showtimeData) => {
        setModalLoading(true);
        setError('');
        try {
            const showtimeRequest = {
                startTime: showtimeData.startTime,
                endTime: showtimeData.endTime,
                showtimeDate: showtimeData.showtimeDate,
                description: showtimeData.description,
                basePrice: parseFloat(showtimeData.basePrice),
                movieId: parseInt(showtimeData.movieId),
                roomId: parseInt(showtimeData.roomId)
            };

            const response = await axios.post(`${API_BASE_URL}/showtimes`, showtimeRequest, getAuthConfig());
            console.log('Showtime created:', response.data);
            setSuccess('Thêm lịch chiếu thành công!');
            closeShowtimeModal();
            await fetchDashboardData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Lỗi tạo lịch chiếu:', err);
            setError('Lỗi khi thêm lịch chiếu: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // TẠO COMBO MỚI
    const createCombo = async (comboData) => {
        setModalLoading(true);
        setError('');
        try {
            const token = getAuthToken();
            if (!token) {
                setError('Token authentication không tồn tại. Vui lòng đăng nhập lại.');
                return;
            }

            const submitData = {
                nameCombo: comboData.nameCombo.trim(),
                price: parseFloat(comboData.price),
                description: comboData.description.trim() || ''
            };

            console.log('📤 Gửi dữ liệu combo:', submitData);

            const response = await axios.post(`${API_BASE_URL}/combos`, submitData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Combo created:', response.data);
            setSuccess('Thêm combo thành công!');
            closeComboModal();
            await fetchDashboardData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Lỗi tạo combo:', err);
            setError('Lỗi khi thêm combo: ' + (err.response?.data?.message || err.message));
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

    const handleShowtimeSubmit = async (e) => {
        e.preventDefault();
        if (!showtimeForm.movieId || !showtimeForm.roomId || !showtimeForm.showtimeDate ||
            !showtimeForm.startTime || !showtimeForm.endTime || !showtimeForm.basePrice) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc!');
            return;
        }

        await createShowtime(showtimeForm);
    };

    // HANDLE SUBMIT CHO COMBO
    const handleComboSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!comboForm.nameCombo.trim()) {
            setError('Vui lòng nhập tên combo!');
            return;
        }

        if (!comboForm.price || parseFloat(comboForm.price) <= 0) {
            setError('Vui lòng nhập giá hợp lệ!');
            return;
        }

        const comboData = {
            nameCombo: comboForm.nameCombo.trim(),
            price: comboForm.price,
            description: comboForm.description.trim() || ''
        };

        console.log('📤 Submitting combo data:', comboData);
        await createCombo(comboData);
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

    const openShowtimeModal = () => {
        setShowtimeForm({
            startTime: '',
            endTime: '',
            showtimeDate: '',
            description: '',
            basePrice: '',
            movieId: '',
            roomId: ''
        });
        setShowShowtimeModal(true);
        setError('');
    };

    // MODAL HANDLER CHO COMBO
    const openComboModal = () => {
        setComboForm({
            nameCombo: '',
            price: '',
            description: ''
        });
        setShowComboModal(true);
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

    const closeShowtimeModal = () => {
        setShowShowtimeModal(false);
        setError('');
    };

    // CLOSE MODAL CHO COMBO
    const closeComboModal = () => {
        setShowComboModal(false);
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
        return timeString.substring(0, 5);
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
            color: 'from-blue-500 to-purple-600',
            bgColor: 'bg-gradient-to-br from-blue-500/20 to-purple-600/20',
            borderColor: 'border-blue-500/30',
            change: `${stats.totalMovies} phim`,
            trend: 'up'
        },
        {
            title: 'Tổng Phòng',
            value: stats.totalRooms.toString(),
            icon: Sofa,
            color: 'from-green-500 to-emerald-600',
            bgColor: 'bg-gradient-to-br from-green-500/20 to-emerald-600/20',
            borderColor: 'border-green-500/30',
            change: `${stats.totalRooms} phòng chiếu`,
            trend: 'up'
        },
        {
            title: 'Lịch Chiếu',
            value: stats.totalShowtimes.toString(),
            icon: Calendar,
            color: 'from-purple-500 to-pink-600',
            bgColor: 'bg-gradient-to-br from-purple-500/20 to-pink-600/20',
            borderColor: 'border-purple-500/30',
            change: `${stats.totalShowtimes} suất chiếu`,
            trend: 'up'
        },
        {
            title: 'Combo',
            value: stats.totalCombos.toString(),
            icon: Package,
            color: 'from-orange-500 to-red-600',
            bgColor: 'bg-gradient-to-br from-orange-500/20 to-red-600/20',
            borderColor: 'border-orange-500/30',
            change: `${stats.totalCombos} gói combo`,
            trend: 'up'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-white/70">Tổng quan về hệ thống rạp chiếu phim</p>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    <p className="ml-4 text-white/70">Đang tải dữ liệu từ server...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white">Dashboard</h1>
                    <p className="text-white/70 mt-2">Tổng quan về hệ thống rạp chiếu phim</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-white backdrop-blur-lg">
                        <AlertCircle className="w-5 h-5" />
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError('')} className="text-xl font-bold hover:text-red-300">×</button>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3 text-white backdrop-blur-lg">
                        <AlertCircle className="w-5 h-5" />
                        <span className="flex-1">{success}</span>
                        <button onClick={() => setSuccess('')} className="text-xl font-bold hover:text-green-300">×</button>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statsData.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div key={index} className={`${stat.bgColor} backdrop-blur-lg rounded-2xl p-6 border ${stat.borderColor} shadow-2xl hover:shadow-xl transition-all`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-white/80">{stat.title}</p>
                                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                                        <p className="text-sm text-white/60 mt-1">{stat.change}</p>
                                    </div>
                                    <div className={`p-3 rounded-full bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Showtimes */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Lịch Chiếu Gần Đây
                            </h3>
                            <span className="text-sm text-white/60">{recentShowtimes.length} suất chiếu</span>
                        </div>
                        <div className="space-y-4">
                            {recentShowtimes.map((showtime) => (
                                <div key={showtime.id} className="flex items-start space-x-3 p-3 hover:bg-white/5 rounded-lg border-l-4 border-blue-500/50 transition-colors">
                                    <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">
                                            {showtime.movie}
                                        </p>
                                        <p className="text-xs text-white/60 mt-1">
                                            {formatTime(showtime.time)} • {formatDate(showtime.date)} • {showtime.room}
                                            {showtime.price && ` • ${formatCurrency(showtime.price)}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {recentShowtimes.length === 0 && (
                                <div className="text-center text-white/60 py-8">
                                    <Calendar className="w-12 h-12 mx-auto mb-2" />
                                    <p>Chưa có lịch chiếu nào</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Thao Tác Nhanh</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={openMovieModal}
                                className="p-4 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors text-center cursor-pointer border border-blue-500/30 hover:border-blue-500/50 group"
                            >
                                <Plus className="w-8 h-8 text-blue-400 mx-auto mb-2 group-hover:text-blue-300 transition-colors" />
                                <span className="text-sm font-medium text-blue-300 group-hover:text-blue-200">Thêm Phim Mới</span>
                            </button>
                            <button
                                onClick={openRoomModal}
                                className="p-4 bg-green-500/20 rounded-xl hover:bg-green-500/30 transition-colors text-center cursor-pointer border border-green-500/30 hover:border-green-500/50 group"
                            >
                                <Sofa className="w-8 h-8 text-green-400 mx-auto mb-2 group-hover:text-green-300 transition-colors" />
                                <span className="text-sm font-medium text-green-300 group-hover:text-green-200">Tạo Phòng Mới</span>
                            </button>

                            <button
                                onClick={openShowtimeModal}
                                disabled={movies.length === 0 || rooms.length === 0}
                                className="p-4 bg-purple-500/20 rounded-xl hover:bg-purple-500/30 transition-colors text-center cursor-pointer border border-purple-500/30 hover:border-purple-500/50 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2 group-hover:text-purple-300 transition-colors" />
                                <span className="text-sm font-medium text-purple-300 group-hover:text-purple-200">Thêm Lịch Chiếu</span>
                            </button>

                            <button
                                onClick={openComboModal}
                                className="p-4 bg-orange-500/20 rounded-xl hover:bg-orange-500/30 transition-colors text-center cursor-pointer border border-orange-500/30 hover:border-orange-500/50 group"
                            >
                                <Package className="w-8 h-8 text-orange-400 mx-auto mb-2 group-hover:text-orange-300 transition-colors" />
                                <span className="text-sm font-medium text-orange-300 group-hover:text-orange-200">Thêm Combo Mới</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* MODAL THÊM COMBO MỚI */}
                {showComboModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    Thêm combo mới
                                </h2>
                                <button onClick={closeComboModal} className="text-white/70 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleComboSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Tên combo *</label>
                                    <input
                                        type="text"
                                        value={comboForm.nameCombo}
                                        onChange={(e) => setComboForm({ ...comboForm, nameCombo: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Nhập tên combo"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Giá (VNĐ) *</label>
                                    <input
                                        type="number"
                                        value={comboForm.price}
                                        onChange={(e) => setComboForm({ ...comboForm, price: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Nhập giá"
                                        step="1000"
                                        min="0"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Mô tả</label>
                                    <textarea
                                        value={comboForm.description}
                                        onChange={(e) => setComboForm({ ...comboForm, description: e.target.value })}
                                        rows="4"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                        placeholder="Nhập mô tả combo"
                                        maxLength="1000"
                                    />
                                    <div className="text-right text-xs text-white/50 mt-1">
                                        {comboForm.description.length}/1000 ký tự
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeComboModal}
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        {modalLoading ? 'Đang xử lý...' : 'Thêm mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Các modal khác (Movie, Room, Showtime) giữ nguyên */}
                {/* Add Movie Modal */}
                {showMovieModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="flex justify-between items-center p-6 border-b border-white/10">
                                <h3 className="text-lg font-semibold text-white">Thêm Phim Mới</h3>
                                <button onClick={closeMovieModal} className="text-white/50 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleMovieSubmit} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">
                                            Tên phim *
                                        </label>
                                        <input
                                            type="text"
                                            value={movieForm.title}
                                            onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập tên phim"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white/80 mb-1">
                                                Thể loại
                                            </label>
                                            <input
                                                type="text"
                                                value={movieForm.genre}
                                                onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                                                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Thể loại"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-white/80 mb-1">
                                                Thời lượng (phút) *
                                            </label>
                                            <input
                                                type="number"
                                                value={movieForm.duration}
                                                onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                                                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="120"
                                                min="1"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">
                                            Ngày phát hành
                                        </label>
                                        <input
                                            type="date"
                                            value={movieForm.releaseDate}
                                            onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">
                                            Mô tả
                                        </label>
                                        <textarea
                                            value={movieForm.description}
                                            onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập mô tả phim"
                                            rows="3"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={closeMovieModal}
                                        className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 transition-colors flex items-center"
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
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="flex justify-between items-center p-6 border-b border-white/10">
                                <h3 className="text-lg font-semibold text-white">Tạo Phòng Mới</h3>
                                <button onClick={closeRoomModal} className="text-white/50 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleRoomSubmit} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">
                                            Tên phòng *
                                        </label>
                                        <input
                                            type="text"
                                            value={roomForm.roomName}
                                            onChange={(e) => setRoomForm({ ...roomForm, roomName: e.target.value })}
                                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="Nhập tên phòng"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white/80 mb-1">
                                                Sức chứa *
                                            </label>
                                            <input
                                                type="number"
                                                value={roomForm.capacity}
                                                onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                                                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                placeholder="100"
                                                min="1"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-white/80 mb-1">
                                                Loại phòng
                                            </label>
                                            <select
                                                value={roomForm.roomType}
                                                onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
                                            >
                                                <option value="STANDARD">Tiêu chuẩn</option>
                                                <option value="VIP">VIP</option>
                                                <option value="IMAX">IMAX</option>
                                                <option value="4DX">4DX</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">
                                            Mô tả
                                        </label>
                                        <textarea
                                            value={roomForm.description}
                                            onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="Nhập mô tả phòng"
                                            rows="3"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={closeRoomModal}
                                        className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-colors flex items-center"
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

                {/* Add Showtime Modal */}
                {showShowtimeModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl w-full max-w-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b border-white/10">
                                <h3 className="text-2xl font-bold text-white">➕ Thêm Lịch Chiếu Mới</h3>
                                <button onClick={closeShowtimeModal} className="text-white/50 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleShowtimeSubmit} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {/* Movie Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-white">Phim *</label>
                                        <select
                                            value={showtimeForm.movieId}
                                            onChange={(e) => setShowtimeForm({ ...showtimeForm, movieId: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
                                            required
                                        >
                                            <option value="">-- Chọn phim --</option>
                                            {movies.map(movie => (
                                                <option key={movie.movieID} value={movie.movieID}>
                                                    {movie.title} {movie.duration && `(${movie.duration} phút)`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Room Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-white">Phòng *</label>
                                        <select
                                            value={showtimeForm.roomId}
                                            onChange={(e) => setShowtimeForm({ ...showtimeForm, roomId: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
                                            required
                                        >
                                            <option value="">-- Chọn phòng --</option>
                                            {rooms.map(room => (
                                                <option key={room.roomID} value={room.roomID}>
                                                    {room.roomName} {room.totalSeats && `(${room.totalSeats} ghế)`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-white">Ngày Chiếu *</label>
                                        <input
                                            type="date"
                                            value={showtimeForm.showtimeDate}
                                            onChange={(e) => setShowtimeForm({ ...showtimeForm, showtimeDate: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-white">
                                            Giá Vé *
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                                            <input
                                                type="number"
                                                value={showtimeForm.basePrice}
                                                onChange={(e) => setShowtimeForm({ ...showtimeForm, basePrice: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                                                placeholder="Nhập giá vé..."
                                                min="0"
                                                step="1000"
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-white/60 mt-1">
                                            Ví dụ: 120000 cho 120,000 ₫
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-white">Giờ Bắt Đầu *</label>
                                        <input
                                            type="time"
                                            value={showtimeForm.startTime}
                                            onChange={(e) => setShowtimeForm({ ...showtimeForm, startTime: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-white">Giờ Kết Thúc *</label>
                                        <input
                                            type="time"
                                            value={showtimeForm.endTime}
                                            onChange={(e) => setShowtimeForm({ ...showtimeForm, endTime: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2 text-white">Mô Tả</label>
                                    <textarea
                                        value={showtimeForm.description}
                                        onChange={(e) => setShowtimeForm({ ...showtimeForm, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                                        rows="3"
                                        placeholder="Nhập mô tả về lịch chiếu (ví dụ: Suất chiếu đặc biệt, có khuyến mãi...)"
                                    />
                                </div>

                                {/* Hiển thị thông tin giá */}
                                {showtimeForm.basePrice && (
                                    <div className="mb-4 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                                        <h4 className="font-semibold text-yellow-300 mb-2">💰 Giá vé sẽ áp dụng:</h4>
                                        <div className="text-center">
                                            <span className="font-bold text-yellow-300 text-2xl">
                                                {formatCurrency(showtimeForm.basePrice)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={closeShowtimeModal}
                                        className="flex-1 px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 text-white transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        {modalLoading ? 'Đang lưu...' : 'Thêm Lịch Chiếu'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;