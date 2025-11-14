import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MovieManagement = () => {
    const [movies, setMovies] = useState([]);
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingMovie, setEditingMovie] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // New movie form data
    const [formData, setFormData] = useState({
        title: '',
        genre: '',
        duration: '',
        description: '',
        releaseDate: ''
    });

    // API base URL
    const API_BASE = 'http://localhost:8080/api/movies';

    // Axios interceptor for auth (giả sử dùng JWT)
    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    // Fetch all movies
    const fetchMovies = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_BASE, {
                headers: getAuthHeaders()
            });
            setMovies(response.data);
            setFilteredMovies(response.data);
            setError('');
        } catch (err) {
            setError('Lỗi khi tải danh sách phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Search movies
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setFilteredMovies(movies);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/search?title=${searchTerm}`, {
                headers: getAuthHeaders()
            });
            setFilteredMovies(response.data);
            setError('');
        } catch (err) {
            setError('Lỗi khi tìm kiếm phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Create new movie
    const handleCreateMovie = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const movieData = {
                title: formData.title,
                genre: formData.genre,
                duration: parseInt(formData.duration),
                description: formData.description,
                releaseDate: formData.releaseDate
            };

            const response = await axios.post(API_BASE, movieData, {
                headers: getAuthHeaders()
            });

            setMovies([...movies, response.data]);
            setFilteredMovies([...movies, response.data]);
            setSuccess('Thêm phim thành công!');
            resetForm();
            setShowForm(false);
        } catch (err) {
            setError('Lỗi khi thêm phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Update movie
    const handleUpdateMovie = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const movieData = {
                title: formData.title,
                genre: formData.genre,
                duration: parseInt(formData.duration),
                description: formData.description,
                releaseDate: formData.releaseDate
            };

            const response = await axios.put(`${API_BASE}/${editingMovie.movieID}`, movieData, {
                headers: getAuthHeaders()
            });

            const updatedMovies = movies.map(movie =>
                movie.movieID === editingMovie.movieID ? response.data : movie
            );

            setMovies(updatedMovies);
            setFilteredMovies(updatedMovies);
            setSuccess('Cập nhật phim thành công!');
            resetForm();
            setShowForm(false);
            setEditingMovie(null);
        } catch (err) {
            setError('Lỗi khi cập nhật phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Delete movie
    const handleDeleteMovie = async (movieId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa phim này?')) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(`${API_BASE}/${movieId}`, {
                headers: getAuthHeaders()
            });

            const updatedMovies = movies.filter(movie => movie.movieID !== movieId);
            setMovies(updatedMovies);
            setFilteredMovies(updatedMovies);
            setSuccess('Xóa phim thành công!');
        } catch (err) {
            setError('Lỗi khi xóa phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Edit movie - populate form
    const handleEditMovie = (movie) => {
        setEditingMovie(movie);
        setFormData({
            title: movie.title,
            genre: movie.genre || '',
            duration: movie.duration.toString(),
            description: movie.description || '',
            releaseDate: movie.releaseDate || ''
        });
        setShowForm(true);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            title: '',
            genre: '',
            duration: '',
            description: '',
            releaseDate: ''
        });
        setEditingMovie(null);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Clear messages
    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    // Effects
    useEffect(() => {
        fetchMovies();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredMovies(movies);
        }
    }, [searchTerm, movies]);

    return (
        <div className="container mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Quản Lý Phim</h1>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                        <span className="mr-2">+</span> Thêm Phim Mới
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6 flex gap-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm phim theo tên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                    >
                        Tìm Kiếm
                    </button>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            fetchMovies();
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                    >
                        Làm Mới
                    </button>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                        <button onClick={clearMessages} className="float-right font-bold">×</button>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                        {success}
                        <button onClick={clearMessages} className="float-right font-bold">×</button>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Đang tải...</span>
                    </div>
                )}

                {/* Movie Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">
                                {editingMovie ? 'Chỉnh Sửa Phim' : 'Thêm Phim Mới'}
                            </h2>
                            <form onSubmit={editingMovie ? handleUpdateMovie : handleCreateMovie}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tên phim *
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Thể loại
                                        </label>
                                        <input
                                            type="text"
                                            name="genre"
                                            value={formData.genre}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Thời lượng (phút) *
                                        </label>
                                        <input
                                            type="number"
                                            name="duration"
                                            value={formData.duration}
                                            onChange={handleInputChange}
                                            required
                                            min="1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mô tả
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày phát hành
                                        </label>
                                        <input
                                            type="date"
                                            name="releaseDate"
                                            value={formData.releaseDate}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Đang xử lý...' : (editingMovie ? 'Cập nhật' : 'Thêm mới')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Movies Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tên Phim
                                </th>
                                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thể Loại
                                </th>
                                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thời Lượng
                                </th>
                                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày Phát Hành
                                </th>
                                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao Tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredMovies.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                        {loading ? 'Đang tải...' : 'Không có phim nào'}
                                    </td>
                                </tr>
                            ) : (
                                filteredMovies.map((movie) => (
                                    <tr key={movie.movieID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{movie.title}</div>
                                            {movie.description && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {movie.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{movie.genre || 'Chưa cập nhật'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{movie.duration} phút</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEditMovie(movie)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMovie(movie.movieID)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Info */}
                <div className="mt-4 text-sm text-gray-600">
                    Hiển thị {filteredMovies.length} trong tổng số {movies.length} phim
                </div>
            </div>
        </div>
    );
};

export default MovieManagement;