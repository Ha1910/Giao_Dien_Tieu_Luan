import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, RefreshCw, Film, Calendar, Clock, AlertCircle, Upload, Image, Video } from 'lucide-react';
import axios from 'axios';

const MovieManagement = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        genre: '',
        duration: '',
        description: '',
        releaseDate: '',
        imageUrl: '',
        trailerUrl: ''
    });

    // Upload state
    const [uploadProgress, setUploadProgress] = useState({
        image: 0,
        video: 0
    });

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGenre, setFilterGenre] = useState('all');

    const API_BASE_URL = 'http://localhost:8080/api/movies';
    const UPLOAD_API_URL = 'http://localhost:8080/api/upload';

    // Lấy JWT token từ localStorage
    const getAuthToken = () => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
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

    // Upload ảnh
    const uploadImage = async (file) => {
        setUploadLoading(true);
        setUploadProgress(prev => ({ ...prev, image: 0 }));

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${UPLOAD_API_URL}/image`, formData, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(prev => ({ ...prev, image: percentCompleted }));
                }
            });

            setSuccess('Upload ảnh thành công!');
            return response.data.data.imageUrl;
        } catch (err) {
            setError('Lỗi khi upload ảnh: ' + (err.response?.data?.message || err.message));
            throw err;
        } finally {
            setUploadLoading(false);
            setUploadProgress(prev => ({ ...prev, image: 0 }));
        }
    };

    // Upload video
    const uploadVideo = async (file) => {
        setUploadLoading(true);
        setUploadProgress(prev => ({ ...prev, video: 0 }));

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${UPLOAD_API_URL}/video`, formData, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(prev => ({ ...prev, video: percentCompleted }));
                }
            });

            setSuccess('Upload video thành công!');
            return response.data.data.videoUrl;
        } catch (err) {
            setError('Lỗi khi upload video: ' + (err.response?.data?.message || err.message));
            throw err;
        } finally {
            setUploadLoading(false);
            setUploadProgress(prev => ({ ...prev, video: 0 }));
        }
    };

    // Handle image file select
    const handleImageSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn file ảnh hợp lệ!');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Kích thước ảnh không được vượt quá 5MB!');
            return;
        }

        try {
            const imageUrl = await uploadImage(file);
            setFormData(prev => ({ ...prev, imageUrl }));
        } catch (err) {
            console.error('Upload image error:', err);
        }
    };

    // Handle video file select
    const handleVideoSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            setError('Vui lòng chọn file video hợp lệ!');
            return;
        }

        // Validate file size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            setError('Kích thước video không được vượt quá 50MB!');
            return;
        }

        try {
            const trailerUrl = await uploadVideo(file);
            setFormData(prev => ({ ...prev, trailerUrl }));
        } catch (err) {
            console.error('Upload video error:', err);
        }
    };

    // Fetch movies
    const fetchMovies = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(API_BASE_URL, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            if (response.data && Array.isArray(response.data)) {
                setMovies(response.data);
                if (response.data.length > 0) {
                    setSuccess(`Đã tải ${response.data.length} phim thành công!`);
                    setTimeout(() => setSuccess(''), 3000);
                }
            } else {
                throw new Error('Dữ liệu trả về không hợp lệ');
            }

        } catch (err) {
            console.error('💥 Lỗi fetch movies:', err);
            if (err.response?.status === 403) {
                setError('🚫 Truy cập bị từ chối. Kiểm tra public endpoints trong SecurityConfig');
            } else if (err.response?.status === 404) {
                setError('🔍 Endpoint không tồn tại: ' + API_BASE_URL);
            } else if (err.response?.status === 500) {
                setError('⚡ Lỗi server: ' + (err.response.data?.message || 'Kiểm tra console backend'));
            } else if (err.request) {
                setError('❌ Không thể kết nối đến server. Kiểm tra backend');
            } else {
                setError('Lỗi không xác định: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Create movie
    const createMovie = async (movieData) => {
        setModalLoading(true);
        try {
            const response = await axios.post(API_BASE_URL, movieData, getAuthConfig());
            setMovies(prevMovies => [...prevMovies, response.data]);
            setSuccess('Thêm phim thành công!');
            closeModal();
            fetchMovies(); // Refresh list
        } catch (err) {
            setError('Lỗi khi thêm phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // Update movie
    const updateMovie = async (movieId, movieData) => {
        setModalLoading(true);
        try {
            const response = await axios.put(`${API_BASE_URL}/${movieId}`, movieData, getAuthConfig());
            setMovies(prevMovies => prevMovies.map(m => m.movieID === movieId ? response.data : m));
            setSuccess('Cập nhật phim thành công!');
            closeModal();
        } catch (err) {
            setError('Lỗi khi cập nhật phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // Delete movie
    const deleteMovie = async (movieId) => {
        setModalLoading(true);
        setError('');

        try {
            await axios.delete(`${API_BASE_URL}/${movieId}`, getAuthConfig());
            setMovies(prevMovies => prevMovies.filter(m => m.movieID !== movieId));
            setSuccess('Đã xóa phim thành công!');
            setShowDeleteModal(false);
            setSelectedMovie(null);
        } catch (err) {
            setError('Lỗi khi xóa phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // Search movies
    const searchMovies = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/search?title=${searchTerm}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setMovies(response.data);
            setSuccess(`Tìm thấy ${response.data.length} phim phù hợp!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Lỗi khi tìm kiếm phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Get unique genres for filter
    const getUniqueGenres = () => {
        const genres = movies.map(movie => movie.genre).filter(Boolean);
        const uniqueGenres = [...new Set(genres.flatMap(genre => genre.split(', ')))];
        return uniqueGenres;
    };

    // Handle submit
    const handleSubmit = async (e) => {
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
            releaseDate: formData.releaseDate || '',
            imageUrl: formData.imageUrl || '',
            trailerUrl: formData.trailerUrl || ''
        };

        console.log('📤 Gửi dữ liệu:', submitData);

        if (selectedMovie) {
            await updateMovie(selectedMovie.movieID, submitData);
        } else {
            await createMovie(submitData);
        }
    };

    const openEditModal = (movie) => {
        setSelectedMovie(movie);
        setFormData({
            title: movie.title || '',
            genre: movie.genre || '',
            duration: movie.duration?.toString() || '',
            description: movie.description || '',
            releaseDate: movie.releaseDate || '',
            imageUrl: movie.imageUrl || '',
            trailerUrl: movie.trailerUrl || ''
        });
        setShowModal(true);
        setError('');
    };

    const openCreateModal = () => {
        setSelectedMovie(null);
        setFormData({
            title: '',
            genre: '',
            duration: '',
            description: '',
            releaseDate: '',
            imageUrl: '',
            trailerUrl: ''
        });
        setShowModal(true);
        setError('');
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedMovie(null);
        setFormData({
            title: '',
            genre: '',
            duration: '',
            description: '',
            releaseDate: '',
            imageUrl: '',
            trailerUrl: ''
        });
        setError('');
        setUploadProgress({ image: 0, video: 0 });
    };

    // Handle search input key press
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (searchTerm.trim()) {
                searchMovies();
            } else {
                fetchMovies();
            }
        }
    };

    // Load data khi component mount
    useEffect(() => {
        fetchMovies();
    }, []);

    // Filter movies for display
    const filteredMovies = movies.filter(movie => {
        const matchesSearch = movie.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            movie.description?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesGenre = true;
        if (filterGenre !== 'all') {
            matchesGenre = movie.genre?.includes(filterGenre);
        }

        return matchesSearch && matchesGenre;
    });

    // Stats
    const stats = {
        total: movies.length,
        averageDuration: movies.length > 0 ?
            Math.round(movies.reduce((sum, movie) => sum + (movie.duration || 0), 0) / movies.length) : 0,
        actionMovies: movies.filter(m => m.genre?.includes('Action')).length,
        dramaMovies: movies.filter(m => m.genre?.includes('Drama')).length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                <Film className="w-10 h-10" />
                                Quản Lý Phim
                            </h1>
                            <p className="text-white/70 mt-2">Quản lý danh sách phim và thông tin chi tiết</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchMovies}
                                disabled={loading}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Đang tải...' : 'Làm mới'}
                            </button>
                            <button
                                onClick={openCreateModal}
                                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Thêm phim
                            </button>
                        </div>
                    </div>
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-6 border border-blue-500/30">
                        <div className="text-3xl font-bold text-blue-300">{stats.total}</div>
                        <div className="text-blue-200 text-sm mt-1">Tổng số phim</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30">
                        <div className="text-3xl font-bold text-green-300">{stats.averageDuration}</div>
                        <div className="text-green-200 text-sm mt-1">Thời lượng TB (phút)</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                        <div className="text-3xl font-bold text-purple-300">{stats.actionMovies}</div>
                        <div className="text-purple-200 text-sm mt-1">Phim Hành Động</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/30">
                        <div className="text-3xl font-bold text-yellow-300">{stats.dramaMovies}</div>
                        <div className="text-yellow-200 text-sm mt-1">Phim Chính Kịch</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex items-center gap-2 mb-4 text-white">
                        <Search className="w-5 h-5" />
                        <h2 className="text-xl font-bold">Tìm kiếm & Lọc</h2>
                    </div>
                    <div className="flex gap-4 flex-col md:flex-row">
                        <input
                            type="text"
                            placeholder="Tìm theo tên phim hoặc mô tả..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={filterGenre}
                            onChange={(e) => setFilterGenre(e.target.value)}
                            className="px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
                        >
                            <option value="all">Tất cả thể loại</option>
                            {getUniqueGenres().map(genre => (
                                <option key={genre} value={genre}>{genre}</option>
                            ))}
                        </select>
                        <button
                            onClick={searchTerm.trim() ? searchMovies : fetchMovies}
                            disabled={loading}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            <Search className="w-5 h-5" />
                            Áp dụng
                        </button>
                    </div>
                </div>

                {/* Movies Grid */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Film className="w-5 h-5" />
                            Danh sách phim ({filteredMovies.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-white/70">Đang tải dữ liệu...</p>
                        </div>
                    ) : filteredMovies.length === 0 ? (
                        <div className="p-12 text-center">
                            <Film className="w-16 h-16 text-white/30 mx-auto mb-4" />
                            <p className="text-white/70">
                                {searchTerm || filterGenre !== 'all' ? 'Không tìm thấy phim phù hợp' : 'Chưa có phim nào'}
                            </p>
                            {(searchTerm || filterGenre !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterGenre('all');
                                        fetchMovies();
                                    }}
                                    className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {filteredMovies.map((movie) => (
                                <div key={movie.movieID} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105">
                                    {/* Movie Poster */}
                                    {movie.imageUrl && (
                                        <div className="mb-4 rounded-lg overflow-hidden">
                                            <img
                                                src={movie.imageUrl}
                                                alt={movie.title}
                                                className="w-full h-48 object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white truncate">
                                                {movie.title}
                                            </h3>
                                            {movie.genre && (
                                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                    {movie.genre}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(movie)}
                                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedMovie(movie);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {movie.description && (
                                            <p className="text-white/70 text-sm line-clamp-2">
                                                {movie.description}
                                            </p>
                                        )}

                                        {/* Trailer Preview */}
                                        {movie.trailerUrl && (
                                            <div className="pt-2">
                                                <a
                                                    href={movie.trailerUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    Xem trailer
                                                </a>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-white/70">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm">{movie.duration} phút</span>
                                            </div>
                                            {movie.releaseDate && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-white/10">
                                            <div className="text-xs text-white/50 font-mono">
                                                ID: {movie.movieID}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {selectedMovie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}
                                </h2>
                                <button onClick={closeModal} className="text-white/70 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white/80 mb-2 text-sm font-medium">Tên phim *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập tên phim"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-white/80 mb-2 text-sm font-medium">Thể loại</label>
                                        <input
                                            type="text"
                                            value={formData.genre}
                                            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ví dụ: Action, Drama, Comedy"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white/80 mb-2 text-sm font-medium">Thời lượng (phút) *</label>
                                        <input
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập thời lượng phim"
                                            step="1"
                                            min="1"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-white/80 mb-2 text-sm font-medium">Ngày phát hành</label>
                                        <input
                                            type="date"
                                            value={formData.releaseDate}
                                            onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Mô tả về phim..."
                                        rows="3"
                                    />
                                </div>

                                {/* Upload Sections */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Image Upload */}
                                    <div className="space-y-3">
                                        <label className="block text-white/80 text-sm font-medium">Ảnh Poster</label>
                                        <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:border-white/40 transition-colors">
                                            <input
                                                type="file"
                                                id="image-upload"
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                                className="hidden"
                                            />
                                            <label htmlFor="image-upload" className="cursor-pointer">
                                                <Image className="w-8 h-8 text-white/50 mx-auto mb-2" />
                                                <p className="text-white/70 text-sm">
                                                    {formData.imageUrl ? 'Đã chọn ảnh' : 'Chọn ảnh poster'}
                                                </p>
                                                <p className="text-white/50 text-xs mt-1">JPG, PNG (Tối đa 5MB)</p>
                                            </label>
                                        </div>

                                        {uploadProgress.image > 0 && (
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress.image}%` }}
                                                ></div>
                                            </div>
                                        )}

                                        {formData.imageUrl && (
                                            <div className="mt-2">
                                                <img
                                                    src={formData.imageUrl}
                                                    alt="Preview"
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                                                    className="text-red-400 text-xs mt-1 hover:text-red-300"
                                                >
                                                    Xóa ảnh
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Video Upload */}
                                    <div className="space-y-3">
                                        <label className="block text-white/80 text-sm font-medium">Trailer Video</label>
                                        <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:border-white/40 transition-colors">
                                            <input
                                                type="file"
                                                id="video-upload"
                                                accept="video/*"
                                                onChange={handleVideoSelect}
                                                className="hidden"
                                            />
                                            <label htmlFor="video-upload" className="cursor-pointer">
                                                <Video className="w-8 h-8 text-white/50 mx-auto mb-2" />
                                                <p className="text-white/70 text-sm">
                                                    {formData.trailerUrl ? 'Đã chọn video' : 'Chọn trailer video'}
                                                </p>
                                                <p className="text-white/50 text-xs mt-1">MP4, MOV (Tối đa 50MB)</p>
                                            </label>
                                        </div>

                                        {uploadProgress.video > 0 && (
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress.video}%` }}
                                                ></div>
                                            </div>
                                        )}

                                        {formData.trailerUrl && (
                                            <div className="mt-2">
                                                <video
                                                    src={formData.trailerUrl}
                                                    className="w-full h-32 object-cover rounded-lg"
                                                    controls
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, trailerUrl: '' }))}
                                                    className="text-red-400 text-xs mt-1 hover:text-red-300"
                                                >
                                                    Xóa video
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={modalLoading || uploadLoading}
                                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modalLoading || uploadLoading}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        {modalLoading ? 'Đang xử lý...' : selectedMovie ? 'Cập nhật' : 'Thêm mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && selectedMovie && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa</h3>
                                <p className="text-white/70 mb-6">
                                    Bạn có chắc chắn muốn xóa phim <strong className="text-white">{selectedMovie.title}</strong>?
                                    <br />Hành động này không thể hoàn tác!
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setSelectedMovie(null);
                                        }}
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => deleteMovie(selectedMovie.movieID)}
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {modalLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Đang xóa...
                                            </>
                                        ) : (
                                            'Xóa'
                                        )}
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

export default MovieManagement;