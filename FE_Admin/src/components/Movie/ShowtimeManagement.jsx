import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Calendar, Clock, Film, Users, Search, RefreshCw } from 'lucide-react';
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
        movieId: '',
        roomId: ''
    });

    // Filters
    const [filters, setFilters] = useState({
        movie: '',
        room: '',
        date: ''
    });

    // Fetch data
    useEffect(() => {
        fetchShowtimes();
        fetchMovies();
        fetchRooms();
    }, []);

    // Debug data
    useEffect(() => {
        console.log('Movies:', movies);
        console.log('Rooms:', rooms);
        console.log('Showtimes:', showtimes);
    }, [movies, rooms, showtimes]);

    const fetchShowtimes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/showtimes');
            setShowtimes(response.data);
        } catch (err) {
            setError('Lỗi khi tải danh sách lịch chiếu: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchMovies = async () => {
        try {
            const response = await api.get('/movies');
            setMovies(response.data);
        } catch (err) {
            console.error('Lỗi khi tải danh sách phim:', err);
            setError('Lỗi khi tải danh sách phim: ' + (err.response?.data?.message || err.message));
        }
    };

    const fetchRooms = async () => {
        try {
            const response = await api.get('/rooms');
            setRooms(response.data);
        } catch (err) {
            console.error('Lỗi khi tải danh sách phòng:', err);
            setError('Lỗi khi tải danh sách phòng: ' + (err.response?.data?.message || err.message));
        }
    };

    const fetchShowtimesByMovie = async (movieId) => {
        if (!movieId) {
            fetchShowtimes();
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/showtimes/movie/${movieId}`);
            setShowtimes(response.data);
        } catch (err) {
            setError('Lỗi khi tải lịch chiếu theo phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchShowtimesByDate = async (date) => {
        if (!date) {
            fetchShowtimes();
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/showtimes/date/${date}`);
            setShowtimes(response.data);
        } catch (err) {
            setError('Lỗi khi tải lịch chiếu theo ngày: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
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
                movieId: parseInt(formData.movieId),
                roomId: parseInt(formData.roomId)
            };

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
            movieId: '',
            roomId: ''
        });
    };

    // Filter functions
    const applyFilters = () => {
        if (filters.movie) {
            fetchShowtimesByMovie(filters.movie);
        } else if (filters.date) {
            fetchShowtimesByDate(filters.date);
        } else {
            fetchShowtimes();
        }
    };

    const resetFilters = () => {
        setFilters({ movie: '', room: '', date: '' });
        fetchShowtimes();
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

    // Kiểm tra xung đột lịch chiếu
    const isTimeConflict = (newShowtime) => {
        return showtimes.some(st =>
            st.room?.roomID === parseInt(newShowtime.roomId) &&
            st.showtimeDate === newShowtime.showtimeDate &&
            st.showtimeID !== newShowtime.showtimeID &&
            (
                (newShowtime.startTime >= st.startTime && newShowtime.startTime < st.endTime) ||
                (newShowtime.endTime > st.startTime && newShowtime.endTime <= st.endTime) ||
                (newShowtime.startTime <= st.startTime && newShowtime.endTime >= st.endTime)
            )
        );
    };

    // Tính toán thời gian kết thúc tự động dựa trên duration của phim
    const calculateEndTime = (startTime, movieId) => {
        if (!startTime || !movieId) return '';

        const movie = movies.find(m => m.movieID === parseInt(movieId));
        if (!movie || !movie.duration) return '';

        const [hours, minutes] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate.getTime() + movie.duration * 60000); // duration in minutes
        return endDate.toTimeString().slice(0, 5);
    };

    // Lọc showtimes cục bộ theo phòng
    const filteredShowtimes = showtimes.filter(showtime => {
        if (filters.room && showtime.room?.roomID !== parseInt(filters.room)) {
            return false;
        }
        return true;
    });

    // Xử lý khi chọn phim - tự động tính endTime
    const handleMovieChange = (movieId) => {
        setFormData(prev => ({
            ...prev,
            movieId,
            endTime: calculateEndTime(prev.startTime, movieId)
        }));
    };

    // Xử lý khi chọn startTime - tự động tính endTime
    const handleStartTimeChange = (startTime) => {
        setFormData(prev => ({
            ...prev,
            startTime,
            endTime: calculateEndTime(startTime, prev.movieId)
        }));
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
                                className="flex items-center gap-2 bg-white/10 text-white px-4 py-3 rounded-lg hover:bg-white/20 transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Làm Mới
                            </button>
                            <button
                                onClick={() => {
                                    resetForm();
                                    setShowModal(true);
                                }}
                                disabled={movies.length === 0 || rooms.length === 0}
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
                <div className="mb-4 grid grid-cols-3 gap-4">
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
                </div>

                {/* Filters */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-6 mb-6 border border-white/20">
                    <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Tìm Kiếm & Lọc
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Movie Filter - FIXED */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Theo Phim</label>
                            <select
                                value={filters.movie}
                                onChange={(e) => setFilters({ ...filters, movie: e.target.value })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-black focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="">Tất cả phim ({movies.length})</option>
                                {movies.map(movie => (
                                    <option key={movie.movieID} value={movie.movieID}>
                                        {movie.title} {movie.duration && `(${movie.duration} phút)`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Room Filter - FIXED */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Theo Phòng</label>
                            <select
                                value={filters.room}
                                onChange={(e) => setFilters({ ...filters, room: e.target.value })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-black focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="">Tất cả phòng ({rooms.length})</option>
                                {rooms.map(room => (
                                    <option key={room.roomID} value={room.roomID}>
                                        {room.roomName} {room.totalSeats && `(${room.totalSeats} ghế)`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Theo Ngày</label>
                            <input
                                type="date"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                onClick={applyFilters}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 flex items-center justify-center gap-2"
                            >
                                <Search className="w-4 h-4" />
                                Tìm Kiếm
                            </button>
                            <button
                                onClick={resetFilters}
                                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Làm Mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* Showtimes List */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-6 border border-white/20">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Danh Sách Lịch Chiếu ({filteredShowtimes.length})
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
                    ) : filteredShowtimes.length === 0 ? (
                        <div className="text-center text-white/60 py-16">
                            <Calendar className="w-16 h-16 mx-auto mb-4" />
                            <p>Không có lịch chiếu nào</p>
                            {showtimes.length === 0 && (
                                <p className="text-sm mt-2">Hãy thêm lịch chiếu đầu tiên bằng nút "Thêm Lịch Chiếu"</p>
                            )}
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
                                        <th className="text-left p-4">Thời lượng</th>
                                        <th className="text-left p-4">Mô Tả</th>
                                        <th className="text-left p-4">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredShowtimes.map(showtime => {
                                        const movie = movies.find(m => m.movieID === showtime.movie?.movieID);
                                        const duration = movie?.duration || 0;

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
                                                    <div className="text-center">
                                                        <div className="font-semibold">{duration} phút</div>
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
                                    {/* Movie Selection - FIXED */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-white">Phim *</label>
                                        <select
                                            value={formData.movieId}
                                            onChange={(e) => handleMovieChange(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-black focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                            required
                                        >
                                            <option value="">-- Chọn phim --</option>
                                            {movies.map(movie => (
                                                <option key={movie.movieID} value={movie.movieID}>
                                                    {movie.title} {movie.duration && `(${movie.duration} phút)`}
                                                </option>
                                            ))}
                                        </select>
                                        {movies.length === 0 ? (
                                            <p className="text-red-300 text-sm mt-1">❌ Chưa có phim nào</p>
                                        ) : (
                                            <p className="text-green-300 text-sm mt-1">✅ Có {movies.length} phim để chọn</p>
                                        )}
                                    </div>

                                    {/* Room Selection - FIXED */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-white">Phòng *</label>
                                        <select
                                            value={formData.roomId}
                                            onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-black focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                            required
                                        >
                                            <option value="">-- Chọn phòng --</option>
                                            {rooms.map(room => (
                                                <option key={room.roomID} value={room.roomID}>
                                                    {room.roomName} {room.totalSeats && `(${room.totalSeats} ghế)`}
                                                </option>
                                            ))}
                                        </select>
                                        {rooms.length === 0 ? (
                                            <p className="text-red-300 text-sm mt-1">❌ Chưa có phòng nào</p>
                                        ) : (
                                            <p className="text-green-300 text-sm mt-1">✅ Có {rooms.length} phòng để chọn</p>
                                        )}
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

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-white">Giờ Bắt Đầu *</label>
                                            <input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => handleStartTimeChange(e.target.value)}
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
                                                readOnly={!!formData.movieId}
                                            />
                                            {formData.movieId && (
                                                <p className="text-xs text-blue-300 mt-1">⏱️ Tự động tính từ thời lượng phim</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2 text-white">Mô Tả</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                            rows="3"
                                            placeholder="Nhập mô tả về lịch chiếu (ví dụ: Suất chiếu đặc biệt, có khuyến mãi...)"
                                        />
                                    </div>
                                </div>

                                {/* Hiển thị thông tin phim được chọn */}
                                {formData.movieId && (
                                    <div className="mb-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                        <h4 className="font-semibold text-blue-300 mb-2">📽️ Thông tin phim:</h4>
                                        {(() => {
                                            const movie = movies.find(m => m.movieID === parseInt(formData.movieId));
                                            return movie ? (
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div><span className="text-blue-200">Tên:</span> {movie.title}</div>
                                                    <div><span className="text-blue-200">Thể loại:</span> {movie.genre}</div>
                                                    <div><span className="text-blue-200">Thời lượng:</span> {movie.duration} phút</div>
                                                    <div><span className="text-blue-200">Ngày phát hành:</span> {formatDate(movie.releaseDate)}</div>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                )}

                                {/* Hiển thị thông tin phòng được chọn */}
                                {formData.roomId && (
                                    <div className="mb-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                                        <h4 className="font-semibold text-green-300 mb-2">🎪 Thông tin phòng:</h4>
                                        {(() => {
                                            const room = rooms.find(r => r.roomID === parseInt(formData.roomId));
                                            return room ? (
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div><span className="text-green-200">Tên:</span> {room.roomName}</div>
                                                    <div><span className="text-green-200">Loại:</span> {room.roomType}</div>
                                                    <div><span className="text-green-200">Số ghế:</span> {room.totalSeats}</div>
                                                    <div><span className="text-green-200">Kích thước:</span> {room.totalRows}×{room.totalColumns}</div>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                )}

                                {/* Conflict Warning */}
                                {formData.roomId && formData.showtimeDate && formData.startTime && formData.endTime &&
                                    isTimeConflict(formData) && (
                                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 text-white rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">⚠️</span>
                                                <div>
                                                    <strong>Cảnh báo xung đột lịch chiếu!</strong>
                                                    <p className="text-sm mt-1">Lịch chiếu này bị trùng thời gian với lịch chiếu khác trong cùng phòng.</p>
                                                </div>
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
                                        disabled={loading ||
                                            (formData.roomId && formData.showtimeDate &&
                                                formData.startTime && formData.endTime &&
                                                isTimeConflict(formData)) ||
                                            !formData.movieId || !formData.roomId ||
                                            !formData.showtimeDate || !formData.startTime || !formData.endTime
                                        }
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