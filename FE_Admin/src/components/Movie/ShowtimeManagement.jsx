import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Calendar, Clock, Film, Users, Search, RefreshCw, DollarSign } from 'lucide-react';
import axios from 'axios';

// Tạo instance axios với cấu hình mặc định
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Thêm interceptor để xử lý token (nếu có)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Thêm interceptor để xử lý response
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

const ShowtimeManagement = () => {
    const [showtimes, setShowtimes] = useState([]);
    const [movies, setMovies] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        showtimeID: null,
        startTime: '',
        endTime: '',
        showtimeDate: '',
        description: '',
        basePrice: '', // Giá vé - bắt buộc nhập
        movieId: '',
        roomId: ''
    });

    // Fetch data
    useEffect(() => {
        fetchShowtimes();
        fetchMovies();
        fetchRooms();
    }, []);

    const fetchShowtimes = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('🔄 Đang gọi API showtimes...');
            const response = await api.get('/showtimes');
            console.log('✅ API Response status:', response.status);
            console.log('📊 Response data:', response.data);

            // Xử lý nhiều định dạng response khác nhau
            let showtimesData = response.data;

            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                showtimesData = response.data.data;
            } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
                showtimesData = response.data.content;
            } else if (Array.isArray(response.data)) {
                showtimesData = response.data;
            } else if (response.data && typeof response.data === 'object') {
                showtimesData = [response.data];
            } else {
                showtimesData = [];
            }

            console.log('🎬 Processed showtimes:', showtimesData);
            setShowtimes(showtimesData);

        } catch (err) {
            console.error('💥 Lỗi fetch showtimes:', err);
            console.error('📡 Error response:', err.response);

            if (err.response?.status === 404) {
                setError('API endpoint /showtimes không tồn tại. Kiểm tra lại đường dẫn API.');
            } else if (err.response?.status === 403) {
                setError('Không có quyền truy cập. Kiểm tra authentication token.');
            } else if (err.response?.status === 500) {
                setError('Lỗi server. Kiểm tra console backend.');
            } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
                setError('Không thể kết nối đến server. Kiểm tra kết nối mạng và URL.');
            } else {
                setError('Lỗi khi tải danh sách lịch chiếu: ' + (err.response?.data?.message || err.message));
            }
            setShowtimes([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMovies = async () => {
        try {
            const response = await api.get('/movies');
            let moviesData = response.data;

            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                moviesData = response.data.data;
            } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
                moviesData = response.data.content;
            } else if (Array.isArray(response.data)) {
                moviesData = response.data;
            }

            setMovies(moviesData || []);
        } catch (err) {
            console.error('Lỗi khi tải danh sách phim:', err);
            setError('Lỗi khi tải danh sách phim: ' + (err.response?.data?.message || err.message));
            setMovies([]);
        }
    };

    const fetchRooms = async () => {
        try {
            const response = await api.get('/rooms');
            let roomsData = response.data;

            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                roomsData = response.data.data;
            } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
                roomsData = response.data.content;
            } else if (Array.isArray(response.data)) {
                roomsData = response.data;
            }

            setRooms(roomsData || []);
        } catch (err) {
            console.error('Lỗi khi tải danh sách phòng:', err);
            setError('Lỗi khi tải danh sách phòng: ' + (err.response?.data?.message || err.message));
            setRooms([]);
        }
    };

    // CRUD Operations
    const saveShowtime = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let response;
            const showtimeRequest = {
                startTime: formData.startTime,
                endTime: formData.endTime,
                showtimeDate: formData.showtimeDate,
                description: formData.description,
                basePrice: parseFloat(formData.basePrice), // Bắt buộc nhập, không có mặc định
                movieId: parseInt(formData.movieId),
                roomId: parseInt(formData.roomId)
            };

            console.log('Sending showtime data:', showtimeRequest);

            if (formData.showtimeID) {
                response = await api.put(`/showtimes/${formData.showtimeID}`, showtimeRequest);
            } else {
                response = await api.post('/showtimes', showtimeRequest);
            }

            if (response.status === 200 || response.status === 201) {
                setSuccess(formData.showtimeID ? 'Cập nhật lịch chiếu thành công!' : 'Thêm lịch chiếu thành công!');
                setShowModal(false);
                resetForm();
                fetchShowtimes();
            }
        } catch (err) {
            console.error('Save showtime error:', err);
            setError('Lỗi khi lưu lịch chiếu: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const deleteShowtime = async (showtimeId) => {
        setLoading(true);
        try {
            await api.delete(`/showtimes/${showtimeId}`);
            setSuccess('Xóa lịch chiếu thành công!');
            setShowDeleteConfirm(false);
            fetchShowtimes();
        } catch (err) {
            setError('Lỗi khi xóa lịch chiếu: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const editShowtime = (showtime) => {
        setFormData({
            showtimeID: showtime.showtimeID,
            startTime: showtime.startTime,
            endTime: showtime.endTime,
            showtimeDate: showtime.showtimeDate,
            description: showtime.description || '',
            basePrice: showtime.basePrice ? showtime.basePrice.toString() : '',
            movieId: showtime.movie?.movieID || '',
            roomId: showtime.room?.roomID || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            showtimeID: null,
            startTime: '',
            endTime: '',
            showtimeDate: '',
            description: '',
            basePrice: '',
            movieId: '',
            roomId: ''
        });
    };

    // Helper functions
    const formatTime = (timeString) => {
        if (!timeString) return '';
        const time = new Date(`2000-01-01T${timeString}`);
        return time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Refresh all data
    const handleRefreshAll = () => {
        setError('');
        setSuccess('');
        fetchShowtimes();
        fetchMovies();
        fetchRooms();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white">🎬 Quản Lý Lịch Chiếu</h1>
                            <p className="text-white/70 mt-2">Quản lý và theo dõi lịch chiếu phim trong hệ thống rạp</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleRefreshAll}
                                disabled={loading}
                                className="flex items-center gap-2 bg-white/10 text-white px-4 py-3 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Đang tải...' : 'Làm Mới'}
                            </button>
                            <button
                                onClick={() => {
                                    resetForm();
                                    setShowModal(true);
                                }}
                                disabled={movies.length === 0 || rooms.length === 0 || loading}
                                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-teal-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Thêm Lịch Chiếu
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500 text-white rounded-lg flex justify-between backdrop-blur-md">
                        <div className="flex-1">
                            <strong>Lỗi:</strong> {error}
                        </div>
                        <button onClick={() => setError('')} className="font-bold hover:text-red-300 ml-4">×</button>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-500/20 border border-green-500 text-white rounded-lg flex justify-between backdrop-blur-md">
                        <div className="flex-1">
                            <strong>Thành công:</strong> {success}
                        </div>
                        <button onClick={() => setSuccess('')} className="font-bold hover:text-green-300 ml-4">×</button>
                    </div>
                )}

                {/* Thông báo nếu thiếu dữ liệu */}
                {(movies.length === 0 || rooms.length === 0) && (
                    <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500 text-white rounded-lg backdrop-blur-md">
                        <p className="font-semibold">⚠️ Thiếu dữ liệu cần thiết:</p>
                        <ul className="list-disc list-inside mt-2 text-sm">
                            {movies.length === 0 && <li>Chưa có phim nào. Vui lòng thêm phim trước khi tạo lịch chiếu.</li>}
                            {rooms.length === 0 && <li>Chưa có phòng nào. Vui lòng thêm phòng trước khi tạo lịch chiếu.</li>}
                        </ul>
                    </div>
                )}

                {/* Data Status */}
                <div className="mb-4 grid grid-cols-4 gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-center">
                        <div className="text-2xl font-bold text-blue-300">{movies.length}</div>
                        <div className="text-sm text-blue-200">Tổng số phim</div>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center">
                        <div className="text-2xl font-bold text-green-300">{rooms.length}</div>
                        <div className="text-sm text-green-200">Tổng số phòng</div>
                    </div>
                    <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20 text-center">
                        <div className="text-2xl font-bold text-purple-300">{showtimes.length}</div>
                        <div className="text-sm text-purple-200">Tổng lịch chiếu</div>
                    </div>
                    <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 text-center">
                        <div className="text-2xl font-bold text-yellow-300">
                            {formatCurrency(showtimes.reduce((total, st) => total + (st.basePrice || 0), 0))}
                        </div>
                        <div className="text-sm text-yellow-200">Tổng giá trị</div>
                    </div>
                </div>

                {/* Showtimes List */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-6 border border-white/20">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Danh Sách Lịch Chiếu ({showtimes.length})
                        </h2>
                        <div className="text-sm text-white/60">
                            {movies.length} phim • {rooms.length} phòng
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                            <p className="text-white mt-4">Đang tải dữ liệu...</p>
                        </div>
                    ) : showtimes.length === 0 ? (
                        <div className="text-center text-white/60 py-16">
                            <Calendar className="w-16 h-16 mx-auto mb-4" />
                            <p>Không có lịch chiếu nào</p>
                            <p className="text-sm mt-2">Hãy thêm lịch chiếu đầu tiên bằng nút "Thêm Lịch Chiếu"</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-white">
                                <thead>
                                    <tr className="border-b border-white/20">
                                        <th className="text-left p-4">ID</th>
                                        <th className="text-left p-4">Phim</th>
                                        <th className="text-left p-4">Phòng</th>
                                        <th className="text-left p-4">Ngày Chiếu</th>
                                        <th className="text-left p-4">Giờ Chiếu</th>
                                        <th className="text-left p-4">Giá Vé</th>
                                        <th className="text-left p-4">Mô Tả</th>
                                        <th className="text-left p-4">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {showtimes.map(showtime => {
                                        const movie = movies.find(m => m.movieID === showtime.movie?.movieID);

                                        return (
                                            <tr key={showtime.showtimeID} className="border-b border-white/10 hover:bg-white/5">
                                                <td className="p-4 font-mono">{showtime.showtimeID}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Film className="w-4 h-4 text-blue-300" />
                                                        <div>
                                                            <div className="font-semibold">{showtime.movie?.title || 'Unknown'}</div>
                                                            <div className="text-sm text-white/60">{movie?.genre}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-green-300" />
                                                        <div>
                                                            <div className="font-semibold">{showtime.room?.roomName || 'Unknown'}</div>
                                                            <div className="text-sm text-white/60">{showtime.room?.roomType} • {showtime.room?.totalSeats} ghế</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-yellow-300" />
                                                        {formatDate(showtime.showtimeDate)}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-purple-300" />
                                                        <div className="text-center">
                                                            <div className="font-semibold">{formatTime(showtime.startTime)}</div>
                                                            <div className="text-sm">→ {formatTime(showtime.endTime)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-green-400" />
                                                        <div className="font-semibold text-green-300">
                                                            {formatCurrency(showtime.basePrice)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 max-w-xs">
                                                    <div className="truncate" title={showtime.description}>
                                                        {showtime.description || '-'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => editShowtime(showtime)}
                                                            className="p-2 text-blue-300 hover:bg-blue-500/20 rounded transition-colors"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setFormData({ showtimeID: showtime.showtimeID });
                                                                setShowDeleteConfirm(true);
                                                            }}
                                                            className="p-2 text-red-300 hover:bg-red-500/20 rounded transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {formData.showtimeID ? '✏️ Chỉnh Sửa Lịch Chiếu' : '➕ Thêm Lịch Chiếu Mới'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-white/10 rounded transition-colors"
                                >
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>

                            <form onSubmit={saveShowtime}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {/* Movie Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-white">Phim *</label>
                                        <select
                                            value={formData.movieId}
                                            onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                                            value={formData.roomId}
                                            onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                                            value={formData.showtimeDate}
                                            onChange={(e) => setFormData({ ...formData, showtimeDate: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    {/* Base Price Field - BẮT BUỘC NHẬP */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-white">
                                            Giá Vé *
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                                            <input
                                                type="number"
                                                value={formData.basePrice}
                                                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
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
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-white">Giờ Kết Thúc *</label>
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2 text-white">Mô Tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        placeholder="Nhập mô tả về lịch chiếu (ví dụ: Suất chiếu đặc biệt, có khuyến mãi...)"
                                    />
                                </div>

                                {/* Hiển thị thông tin giá */}
                                {formData.basePrice && (
                                    <div className="mb-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                                        <h4 className="font-semibold text-yellow-300 mb-2">💰 Giá vé sẽ áp dụng:</h4>
                                        <div className="text-center">
                                            <span className="font-bold text-yellow-300 text-2xl">
                                                {formatCurrency(formData.basePrice)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.movieId || !formData.roomId || !formData.showtimeDate || !formData.startTime || !formData.endTime || !formData.basePrice}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        {loading ? 'Đang lưu...' : (formData.showtimeID ? 'Cập Nhật' : 'Thêm Mới')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-white/20">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Xác Nhận Xóa</h3>
                                <p className="text-white/70 mb-6">
                                    Bạn có chắc chắn muốn xóa lịch chiếu này? Hành động này không thể hoàn tác.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => deleteShowtime(formData.showtimeID)}
                                        disabled={loading}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 transition-all"
                                    >
                                        {loading ? 'Đang xóa...' : 'Xóa'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShowtimeManagement;