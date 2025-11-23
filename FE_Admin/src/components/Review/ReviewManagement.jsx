import React, { useState, useEffect } from 'react';
import { Star, Edit2, Trash2, Save, X, Search, RefreshCw, MessageSquare, User, Film, AlertCircle, Filter, Calendar, Ticket } from 'lucide-react';
import axios from 'axios';

const ReviewManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [moviesLoading, setMoviesLoading] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        star: '',
        comment: '',
        movieId: ''
    });

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRating, setFilterRating] = useState('all');
    const [filterMovie, setFilterMovie] = useState('all');
    const [activeTab, setActiveTab] = useState('all');

    const API_BASE_URL = 'http://localhost:8080/api/reviews';
    const MOVIES_API_URL = 'http://localhost:8080/api/movies';

    // Sửa hàm getAuthToken - thêm log để debug
    const getAuthToken = () => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        console.log('🔑 Token:', token ? '✓ Có token' : '✗ Không có token');
        if (token) {
            console.log('🔑 Token value:', token.substring(0, 20) + '...');
        }
        return token;
    };

    // Sửa hàm getAuthConfig - thêm log chi tiết
    const getAuthConfig = () => {
        const token = getAuthToken();
        if (!token) {
            console.error('❌ Không tìm thấy token trong getAuthConfig!');
            setError('❌ Vui lòng đăng nhập lại! Token không tồn tại.');
            return {};
        }

        console.log('✅ Sử dụng token cho request');
        return {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    // Thêm hàm validate token
    const validateToken = () => {
        const token = getAuthToken();
        if (!token) {
            console.error('❌ Không có token');
            return false;
        }

        // Kiểm tra token có hợp lệ không (decode JWT nếu cần)
        try {
            // Giả sử token là JWT, phân tích payload
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp * 1000 < Date.now();
            if (isExpired) {
                console.error('❌ Token đã hết hạn');
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                return false;
            }
            console.log('✅ Token hợp lệ cho user:', payload.sub);
            return true;
        } catch (err) {
            console.log('ℹ️ Token không phải JWT format, tiếp tục sử dụng');
            return true; // Vẫn tiếp tục nếu không phải JWT
        }
    };

    const isLoggedIn = () => {
        const loggedIn = !!getAuthToken();
        console.log('👤 Login status:', loggedIn ? 'Đã đăng nhập' : 'Chưa đăng nhập');
        return loggedIn;
    };

    const fetchMovies = async () => {
        setMoviesLoading(true);
        try {
            console.log('🎬 Fetching movies...');
            const response = await axios.get(MOVIES_API_URL, {
                timeout: 10000
            });

            if (response.data && Array.isArray(response.data)) {
                setMovies(response.data);
                console.log('✅ Movies loaded:', response.data.length);
            } else {
                throw new Error('Dữ liệu phim không hợp lệ');
            }

        } catch (err) {
            console.error('💥 Lỗi fetch movies:', err);
            setError('Lỗi khi tải danh sách phim: ' + (err.response?.data?.message || err.message));
        } finally {
            setMoviesLoading(false);
        }
    };

    const fetchReviewsByMovie = async (movieId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/movie/${movieId}`, {
                timeout: 5000
            });
            return response.data && Array.isArray(response.data) ? response.data : [];
        } catch (err) {
            console.log(`❌ Không có reviews cho movie ${movieId}`);
            return [];
        }
    };

    const fetchAllReviews = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('🔄 Bắt đầu lấy tất cả reviews...');

            const allReviews = [];
            let successfulFetches = 0;

            for (const movie of movies) {
                try {
                    console.log(`📝 Đang lấy reviews cho: ${movie.title}`);
                    const movieReviews = await fetchReviewsByMovie(movie.movieID);

                    if (movieReviews.length > 0) {
                        const reviewsWithMovieInfo = movieReviews.map(review => ({
                            ...review,
                            movie: {
                                movieID: movie.movieID,
                                title: movie.title,
                                genre: movie.genre
                            }
                        }));

                        allReviews.push(...reviewsWithMovieInfo);
                        successfulFetches++;
                        console.log(`✅ Đã lấy ${movieReviews.length} reviews cho "${movie.title}"`);
                    }
                } catch (err) {
                    console.log(`❌ Không có reviews cho "${movie.title}"`);
                }
            }

            setReviews(allReviews);

            if (allReviews.length > 0) {
                setSuccess(`Đã tải ${allReviews.length} đánh giá từ ${successfulFetches} phim!`);
            } else {
                setSuccess('Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!');
            }

        } catch (err) {
            console.error('💥 Lỗi fetch reviews:', err);
            setError('Không thể tải dữ liệu reviews: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchMyReviews = async () => {
        if (!isLoggedIn()) {
            setError('Vui lòng đăng nhập để xem đánh giá của bạn');
            return;
        }

        // Validate token trước khi fetch
        if (!validateToken()) {
            setError('❌ Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại!');
            return;
        }

        setLoading(true);
        try {
            console.log('👤 Fetching my reviews với token...');
            const config = getAuthConfig();
            console.log('📤 Config gửi đi:', config);

            const response = await axios.get(`${API_BASE_URL}/my-reviews`, config);

            if (response.data && Array.isArray(response.data)) {
                setMyReviews(response.data);
                console.log('✅ My reviews loaded:', response.data.length);
            } else {
                setMyReviews([]);
            }
        } catch (err) {
            console.error('💥 Lỗi fetch my reviews:', err);
            console.error('💥 Chi tiết lỗi:', {
                status: err.response?.status,
                data: err.response?.data,
                headers: err.response?.config?.headers
            });

            if (err.response?.status === 401) {
                setError('❌ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                // Xóa token hết hạn
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
            } else {
                setError('Không thể tải đánh giá của bạn: ' + (err.response?.data?.message || err.message));
            }
            setMyReviews([]);
        } finally {
            setLoading(false);
        }
    };

    // Sửa hàm createReview - thêm validate token
    const createReview = async (reviewData) => {
        setModalLoading(true);
        try {
            // Kiểm tra token trước
            const token = getAuthToken();
            if (!token) {
                setError('❌ Vui lòng đăng nhập lại! Token không tồn tại.');
                return;
            }

            // Validate token
            if (!validateToken()) {
                setError('❌ Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại!');
                return;
            }

            const payload = {
                star: parseInt(reviewData.star),
                comment: reviewData.comment || '',
                movieId: parseInt(reviewData.movieId)
            };

            console.log('📤 Creating review với token:', token.substring(0, 20) + '...');
            console.log('📤 Payload:', payload);

            const config = getAuthConfig();
            console.log('📤 Config gửi đi:', config);

            const response = await axios.post(API_BASE_URL, payload, config);

            const newReview = response.data;
            setReviews(prev => [...prev, newReview]);
            setMyReviews(prev => [...prev, newReview]);

            setSuccess('Đã thêm đánh giá thành công!');
            closeModal();

        } catch (err) {
            console.error('💥 Lỗi create review:', err);
            console.error('💥 Chi tiết lỗi:', {
                status: err.response?.status,
                data: err.response?.data,
                headers: err.response?.config?.headers
            });

            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;

            // Xử lý các lỗi cụ thể từ API mới
            if (errorMessage.includes('watched') || errorMessage.includes('watch') || errorMessage.includes('purchase')) {
                setError('❌ Bạn chỉ có thể đánh giá phim đã xem. Vui lòng mua vé và đợi suất chiếu kết thúc.');
            } else if (errorMessage.includes('already reviewed')) {
                setError('❌ Bạn đã đánh giá phim này rồi!');
            } else if (errorMessage.includes('Movie not found')) {
                setError('❌ Phim không tồn tại!');
            } else if (err.response?.status === 401) {
                setError('❌ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                // Xóa token hết hạn
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
            } else if (err.response?.status === 403) {
                setError('❌ Bạn không có quyền thực hiện hành động này.');
            } else {
                setError('❌ Lỗi khi thêm đánh giá: ' + errorMessage);
            }
        } finally {
            setModalLoading(false);
        }
    };

    // Xóa review
    const deleteReview = async (reviewId) => {
        setModalLoading(true);
        try {
            // Validate token trước khi xóa
            if (!validateToken()) {
                setError('❌ Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại!');
                return;
            }

            await axios.delete(`${API_BASE_URL}/${reviewId}`, getAuthConfig());

            // Cập nhật cả all reviews và my reviews
            setReviews(prev => prev.filter(r => r.reviewID !== reviewId));
            setMyReviews(prev => prev.filter(r => r.reviewID !== reviewId));

            setSuccess('✅ Đã xóa đánh giá thành công!');
            setShowDeleteModal(false);
            setSelectedReview(null);

        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
            console.error('💥 Lỗi delete review:', err.response?.data);

            if (err.response?.status === 401) {
                setError('❌ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
            } else if (err.response?.status === 403) {
                setError('❌ Bạn không có quyền xóa đánh giá này.');
            } else {
                setError('❌ Lỗi khi xóa đánh giá: ' + errorMessage);
            }
        } finally {
            setModalLoading(false);
        }
    };

    // Sửa hàm handleSubmit - thêm validate token
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLoggedIn()) {
            setError('❌ Vui lòng đăng nhập để thêm đánh giá!');
            return;
        }

        // Thêm validate token
        if (!validateToken()) {
            setError('❌ Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại!');
            return;
        }

        if (!formData.star || parseInt(formData.star) < 1 || parseInt(formData.star) > 5) {
            setError('❌ Vui lòng chọn số sao từ 1-5!');
            return;
        }

        if (!formData.movieId) {
            setError('❌ Vui lòng chọn phim!');
            return;
        }

        const submitData = {
            star: formData.star,
            comment: formData.comment || '',
            movieId: formData.movieId
        };

        await createReview(submitData);
    };

    const openEditModal = (review) => {
        if (!isLoggedIn()) {
            setError('❌ Vui lòng đăng nhập để chỉnh sửa đánh giá!');
            return;
        }

        // Validate token trước khi mở modal edit
        if (!validateToken()) {
            setError('❌ Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại!');
            return;
        }

        setSelectedReview(review);
        setFormData({
            star: review.star?.toString() || '',
            comment: review.comment || '',
            movieId: review.movie?.movieID?.toString() || ''
        });
        setShowModal(true);
        setError('');
    };

    const openCreateModal = () => {
        if (!isLoggedIn()) {
            setError('❌ Vui lòng đăng nhập để thêm đánh giá!');
            return;
        }

        // Validate token trước khi mở modal create
        if (!validateToken()) {
            setError('❌ Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại!');
            return;
        }

        setSelectedReview(null);
        setFormData({
            star: '',
            comment: '',
            movieId: ''
        });
        setShowModal(true);
        setError('');
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedReview(null);
        setFormData({ star: '', comment: '', movieId: '' });
        setError('');
    };

    // Handle search input key press
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (activeTab === 'all') {
                fetchAllReviews();
            } else {
                fetchMyReviews();
            }
        }
    };

    const StarRating = ({ rating, size = 'medium' }) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span
                    key={i}
                    className={`${i <= rating ? 'text-yellow-400' : 'text-gray-300'} ${size === 'large' ? 'text-2xl' : size === 'small' ? 'text-sm' : 'text-lg'
                        }`}
                >
                    ★
                </span>
            );
        }
        return <div className="flex gap-1">{stars}</div>;
    };

    // Load data khi component mount
    useEffect(() => {
        fetchMovies();
    }, []);

    // Khi movies đã load xong, fetch reviews
    useEffect(() => {
        if (movies.length > 0) {
            fetchAllReviews();
            if (isLoggedIn()) {
                fetchMyReviews();
            }
        }
    }, [movies]);

    useEffect(() => {
        if (activeTab === 'my' && isLoggedIn()) {
            fetchMyReviews();
        }
    }, [activeTab]);

    // Filter reviews for display
    const displayReviews = activeTab === 'all' ? reviews : myReviews;

    const filteredReviews = displayReviews.filter(review => {
        const matchesSearch =
            review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesRating = true;
        if (filterRating !== 'all') {
            matchesRating = review.star === parseInt(filterRating);
        }

        let matchesMovie = true;
        if (filterMovie !== 'all') {
            matchesMovie = review.movie?.movieID === parseInt(filterMovie);
        }

        return matchesSearch && matchesRating && matchesMovie;
    });

    // Stats
    const stats = {
        total: reviews.length,
        myTotal: myReviews.length,
        averageRating: reviews.length > 0 ?
            (reviews.reduce((sum, review) => sum + (review.star || 0), 0) / reviews.length).toFixed(1) : 0,
        fiveStar: reviews.filter(r => r.star === 5).length,
        oneStar: reviews.filter(r => r.star === 1).length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                <MessageSquare className="w-10 h-10" />
                                Quản Lý Đánh Giá Phim
                            </h1>
                            <p className="text-white/70 mt-2">Đánh giá và chia sẻ cảm nhận về các bộ phim bạn đã xem</p>
                            {!isLoggedIn() && (
                                <p className="text-yellow-400 text-sm mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Vui lòng đăng nhập để thêm và quản lý đánh giá của bạn
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    if (activeTab === 'all') {
                                        fetchAllReviews();
                                    } else {
                                        fetchMyReviews();
                                    }
                                }}
                                disabled={loading || moviesLoading}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Đang tải...' : 'Làm mới'}
                            </button>
                            <button
                                onClick={openCreateModal}
                                disabled={moviesLoading || movies.length === 0 || !isLoggedIn()}
                                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
                            >
                                <MessageSquare className="w-5 h-5" />
                                Thêm đánh giá
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
                        <div className="text-blue-200 text-sm mt-1">Tổng đánh giá</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                        <div className="text-3xl font-bold text-purple-300">{stats.myTotal}</div>
                        <div className="text-purple-200 text-sm mt-1">Đánh giá của tôi</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/30">
                        <div className="text-3xl font-bold text-yellow-300">{stats.averageRating}</div>
                        <div className="text-yellow-200 text-sm mt-1">Điểm trung bình</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30">
                        <div className="text-3xl font-bold text-green-300">{stats.fiveStar}</div>
                        <div className="text-green-200 text-sm mt-1">5 sao</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex border-b border-white/10 mb-4">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 font-medium transition-all ${activeTab === 'all'
                                ? 'text-white border-b-2 border-blue-500'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            <MessageSquare className="w-4 h-4 inline mr-2" />
                            Tất cả đánh giá ({reviews.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('my')}
                            disabled={!isLoggedIn()}
                            className={`px-4 py-2 font-medium transition-all flex items-center ${activeTab === 'my'
                                ? 'text-white border-b-2 border-green-500'
                                : 'text-white/60 hover:text-white disabled:opacity-50'
                                }`}
                        >
                            <User className="w-4 h-4 inline mr-2" />
                            Đánh giá của tôi ({myReviews.length})
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 mb-4 text-white">
                        <Filter className="w-5 h-5" />
                        <h2 className="text-xl font-bold">Tìm kiếm & Lọc</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Tìm theo bình luận, phim hoặc người dùng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value)}
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả sao</option>
                            <option value="5">5 sao</option>
                            <option value="4">4 sao</option>
                            <option value="3">3 sao</option>
                            <option value="2">2 sao</option>
                            <option value="1">1 sao</option>
                        </select>
                        <select
                            value={filterMovie}
                            onChange={(e) => setFilterMovie(e.target.value)}
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả phim</option>
                            {movies.map(movie => (
                                <option key={movie.movieID} value={movie.movieID}>
                                    {movie.title}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={activeTab === 'all' ? fetchAllReviews : fetchMyReviews}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            <Search className="w-5 h-5" />
                            Áp dụng
                        </button>
                    </div>
                </div>

                {/* Reviews Grid */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            {activeTab === 'all' ? 'Tất cả đánh giá' : 'Đánh giá của tôi'} ({filteredReviews.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-white/70">Đang tải dữ liệu...</p>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="w-16 h-16 text-white/30 mx-auto mb-4" />
                            <p className="text-white/70">
                                {searchTerm || filterRating !== 'all' || filterMovie !== 'all' ?
                                    'Không tìm thấy đánh giá phù hợp' :
                                    activeTab === 'all' ?
                                        'Chưa có đánh giá nào. Hãy thêm đánh giá đầu tiên!' :
                                        'Bạn chưa có đánh giá nào. Hãy thêm đánh giá đầu tiên!'
                                }
                            </p>
                            {(searchTerm || filterRating !== 'all' || filterMovie !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterRating('all');
                                        setFilterMovie('all');
                                    }}
                                    className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {filteredReviews.map((review) => (
                                <div key={review.reviewID} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-3 flex-wrap">
                                                <div className="flex items-center gap-2 text-white/70">
                                                    <User className="w-4 h-4" />
                                                    <span className="text-sm font-medium">
                                                        {review.customer?.fullName || review.customer?.name || 'Người dùng ẩn danh'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white/70">
                                                    <Film className="w-4 h-4" />
                                                    <span className="text-sm font-medium">
                                                        {review.movie?.title || 'Phim không xác định'}
                                                    </span>
                                                </div>
                                                {review.movie?.genre && (
                                                    <div className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
                                                        {review.movie.genre}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <StarRating rating={review.star} size="large" />
                                                <span className="text-white font-bold text-lg">
                                                    {review.star}.0/5.0
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {activeTab === 'my' && (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(review)}
                                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReview(review);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {review.comment && (
                                        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                                            <p className="text-white/80 leading-relaxed">
                                                {review.comment}
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-white/10">
                                        <div className="text-xs text-white/50 font-mono">
                                            ID: {review.reviewID} • {review.customer?.email && `Email: ${review.customer.email}`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {selectedReview ? 'Chỉnh sửa đánh giá' : 'Thêm đánh giá mới'}
                                </h2>
                                <button onClick={closeModal} className="text-white/70 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Phim *</label>
                                    <select
                                        value={formData.movieId}
                                        onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={moviesLoading || selectedReview}
                                    >
                                        <option value="">{moviesLoading ? 'Đang tải danh sách phim...' : 'Chọn phim'}</option>
                                        {movies.map(movie => (
                                            <option key={movie.movieID} value={movie.movieID}>
                                                {movie.title}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="flex items-start gap-2 mt-2 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                                        <Ticket className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-yellow-300 text-xs">
                                            <strong>Điều kiện:</strong> Chỉ có thể đánh giá phim bạn đã mua vé và suất chiếu đã kết thúc
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Số sao *</label>
                                    <select
                                        value={formData.star}
                                        onChange={(e) => setFormData({ ...formData, star: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Chọn số sao</option>
                                        <option value="5">5 sao - Tuyệt vời</option>
                                        <option value="4">4 sao - Rất tốt</option>
                                        <option value="3">3 sao - Tốt</option>
                                        <option value="2">2 sao - Tạm được</option>
                                        <option value="1">1 sao - Không hay</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Bình luận</label>
                                    <textarea
                                        value={formData.comment}
                                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Chia sẻ cảm nhận của bạn về phim (tối đa 2000 ký tự)..."
                                        rows="4"
                                        maxLength="2000"
                                    />
                                    <div className="text-right text-white/50 text-sm mt-1">
                                        {formData.comment.length}/2000
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modalLoading || moviesLoading}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        {modalLoading ? 'Đang xử lý...' : (selectedReview ? 'Cập nhật' : 'Thêm đánh giá')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && selectedReview && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa</h3>
                                <p className="text-white/70 mb-6">
                                    Bạn có chắc chắn muốn xóa đánh giá về phim <strong className="text-white">{selectedReview.movie?.title}</strong>?
                                    <br />Hành động này không thể hoàn tác!
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setSelectedReview(null);
                                        }}
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => deleteReview(selectedReview.reviewID)}
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

export default ReviewManagement;