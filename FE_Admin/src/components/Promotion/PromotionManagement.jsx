import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, RefreshCw, Tag, Calendar, Percent, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import axios from 'axios';

const PromotionManagement = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState(null);
    const [copiedCode, setCopiedCode] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        discount: '',
        startDate: '',
        endDate: ''
    });

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const API_BASE_URL = 'http://localhost:8080/api/promotions';

    // Fetch promotions
    const fetchPromotions = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('🔄 Đang gọi API promotions...', API_BASE_URL);

            const response = await axios.get(API_BASE_URL, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('✅ Response status:', response.status);
            console.log('✅ Response data:', response.data);

            if (response.data && Array.isArray(response.data)) {
                setPromotions(response.data);
                if (response.data.length > 0) {
                    setSuccess(`Đã tải ${response.data.length} khuyến mãi thành công!`);
                    setTimeout(() => setSuccess(''), 3000);
                }
            } else {
                throw new Error('Dữ liệu trả về không hợp lệ');
            }

        } catch (err) {
            console.error('💥 Lỗi fetch promotions:', err);
            console.error('💥 Error response:', err.response);
            console.error('💥 Error config:', err.config);

            // DEBUG CHI TIẾT HƠN
            if (err.response) {
                // Server trả về response với status code lỗi
                console.log('📊 Response data:', err.response.data);
                console.log('📊 Response status:', err.response.status);
                console.log('📊 Response headers:', err.response.headers);

                if (err.response.status === 403) {
                    setError('🚫 Truy cập bị từ chối. Đã sửa JWT Filter chưa? Kiểm tra public endpoints trong JwtAuthenticationFilter');
                } else if (err.response.status === 401) {
                    setError('🔐 Chưa xác thực. JWT Filter vẫn yêu cầu token?');
                } else if (err.response.status === 404) {
                    setError('🔍 Endpoint không tồn tại: ' + API_BASE_URL);
                } else if (err.response.status === 500) {
                    setError('⚡ Lỗi server: ' + (err.response.data?.message || 'Kiểm tra console backend'));
                }
            } else if (err.request) {
                // Request được gửi nhưng không nhận được response
                console.log('❌ No response received:', err.request);
                setError('❌ Không thể kết nối đến server. Kiểm tra: 1) Backend có đang chạy? 2) Port 8080 có bị block? 3) CORS configuration');
            } else {
                // Lỗi khác
                setError('Lỗi không xác định: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Create promotion
    const createPromotion = async (promotionData) => {
        setModalLoading(true);
        try {
            const response = await axios.post(API_BASE_URL, promotionData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            setPromotions(prevPromotions => [...prevPromotions, response.data]);
            setSuccess('Thêm khuyến mãi thành công!');
            closeModal();
            fetchPromotions(); // Refresh list
        } catch (err) {
            setError('Lỗi khi thêm khuyến mãi: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // Update promotion
    const updatePromotion = async (promotionId, promotionData) => {
        setModalLoading(true);
        try {
            const response = await axios.put(`${API_BASE_URL}/${promotionId}`, promotionData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            setPromotions(prevPromotions => prevPromotions.map(p => p.promoID === promotionId ? response.data : p));
            setSuccess('Cập nhật khuyến mãi thành công!');
            closeModal();
        } catch (err) {
            setError('Lỗi khi cập nhật khuyến mãi: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // Delete promotion
    const deletePromotion = async (promotionId) => {
        setModalLoading(true);
        setError('');

        try {
            await axios.delete(`${API_BASE_URL}/${promotionId}`);

            setPromotions(prevPromotions => prevPromotions.filter(p => p.promoID !== promotionId));
            setSuccess('Đã xóa khuyến mãi thành công!');
            setShowDeleteModal(false);
            setSelectedPromotion(null);

        } catch (err) {
            setError('Lỗi khi xóa khuyến mãi: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // Get active promotions
    const fetchActivePromotions = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/active`);
            setPromotions(response.data);
            setSuccess(`Đã tải ${response.data.length} khuyến mãi đang hoạt động!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Lỗi khi tải khuyến mãi đang hoạt động: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Copy promotion code
    const copyToClipboard = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setSuccess(`Đã sao chép mã ${code} vào clipboard!`);
            setTimeout(() => setCopiedCode(''), 2000);
        } catch (err) {
            setError('Không thể sao chép mã: ' + err.message);
        }
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.code.trim()) {
            setError('Vui lòng nhập mã khuyến mãi!');
            return;
        }

        if (!formData.discount || parseFloat(formData.discount) <= 0 || parseFloat(formData.discount) > 100) {
            setError('Vui lòng nhập phần trăm giảm giá hợp lệ (1-100%)!');
            return;
        }

        if (!formData.startDate || !formData.endDate) {
            setError('Vui lòng chọn ngày bắt đầu và kết thúc!');
            return;
        }

        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            setError('Ngày kết thúc phải sau ngày bắt đầu!');
            return;
        }

        const submitData = {
            code: formData.code.trim().toUpperCase(),
            discount: parseFloat(formData.discount),
            startDate: formData.startDate,
            endDate: formData.endDate
        };

        console.log('📤 Gửi dữ liệu:', submitData);

        if (selectedPromotion) {
            await updatePromotion(selectedPromotion.promoID, submitData);
        } else {
            await createPromotion(submitData);
        }
    };

    const openEditModal = (promotion) => {
        setSelectedPromotion(promotion);
        setFormData({
            code: promotion.code || '',
            discount: promotion.discount?.toString() || '',
            startDate: promotion.startDate || '',
            endDate: promotion.endDate || ''
        });
        setShowModal(true);
        setError('');
    };

    const openCreateModal = () => {
        setSelectedPromotion(null);
        setFormData({
            code: '',
            discount: '',
            startDate: '',
            endDate: ''
        });
        setShowModal(true);
        setError('');
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedPromotion(null);
        setFormData({ code: '', discount: '', startDate: '', endDate: '' });
        setError('');
    };

    // Handle search input key press
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            fetchPromotions();
        }
    };

    // Check if promotion is active
    const isPromotionActive = (promotion) => {
        if (!promotion.startDate || !promotion.endDate) return false;

        const now = new Date();
        const startDate = new Date(promotion.startDate);
        const endDate = new Date(promotion.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day

        return now >= startDate && now <= endDate;
    };

    // Load data khi component mount
    useEffect(() => {
        fetchPromotions();
    }, []);

    // Filter promotions for display
    const filteredPromotions = promotions.filter(promotion => {
        const matchesSearch = promotion.code?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesStatus = true;
        if (filterStatus === 'active') {
            matchesStatus = isPromotionActive(promotion);
        } else if (filterStatus === 'expired') {
            matchesStatus = !isPromotionActive(promotion);
        }

        return matchesSearch && matchesStatus;
    });

    // Stats
    const stats = {
        total: promotions.length,
        active: promotions.filter(p => isPromotionActive(p)).length,
        expired: promotions.filter(p => !isPromotionActive(p)).length,
        averageDiscount: promotions.length > 0 ?
            promotions.reduce((sum, promo) => sum + (promo.discount || 0), 0) / promotions.length : 0
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                <Tag className="w-10 h-10" />
                                Quản Lý Khuyến Mãi
                            </h1>
                            <p className="text-white/70 mt-2">Quản lý mã giảm giá và chương trình khuyến mãi</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchPromotions}
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
                                Thêm khuyến mãi
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
                        <div className="text-blue-200 text-sm mt-1">Tổng số khuyến mãi</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30">
                        <div className="text-3xl font-bold text-green-300">{stats.active}</div>
                        <div className="text-green-200 text-sm mt-1">Đang hoạt động</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-lg rounded-xl p-6 border border-red-500/30">
                        <div className="text-3xl font-bold text-red-300">{stats.expired}</div>
                        <div className="text-red-200 text-sm mt-1">Đã hết hạn</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                        <div className="text-3xl font-bold text-purple-300">
                            {Math.round(stats.averageDiscount)}%
                        </div>
                        <div className="text-purple-200 text-sm mt-1">Giảm giá trung bình</div>
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
                            placeholder="Tìm theo mã khuyến mãi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all" className="bg-gray-900 text-white">Tất cả</option>
                            <option value="active" className="bg-gray-900 text-green-400">Đang hoạt động</option>
                            <option value="expired" className="bg-gray-900 text-red-400">Đã hết hạn</option>
                        </select>
                        <button
                            onClick={filterStatus === 'active' ? fetchActivePromotions : fetchPromotions}
                            disabled={loading}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            <Search className="w-5 h-5" />
                            Áp dụng
                        </button>
                    </div>
                </div>

                {/* Promotions Grid */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Danh sách khuyến mãi ({filteredPromotions.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-white/70">Đang tải dữ liệu...</p>
                        </div>
                    ) : filteredPromotions.length === 0 ? (
                        <div className="p-12 text-center">
                            <Tag className="w-16 h-16 text-white/30 mx-auto mb-4" />
                            <p className="text-white/70">
                                {searchTerm || filterStatus !== 'all' ? 'Không tìm thấy khuyến mãi phù hợp' : 'Chưa có khuyến mãi nào'}
                            </p>
                            {(searchTerm || filterStatus !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterStatus('all');
                                        fetchPromotions();
                                    }}
                                    className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {filteredPromotions.map((promotion) => {
                                const isActive = isPromotionActive(promotion);
                                return (
                                    <div key={promotion.promoID} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-white truncate flex items-center gap-2">
                                                    {promotion.code}
                                                    {copiedCode === promotion.code ? (
                                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <button
                                                            onClick={() => copyToClipboard(promotion.code)}
                                                            className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            title="Sao chép mã"
                                                        >
                                                            <Copy className="w-4 h-4 text-blue-400" />
                                                        </button>
                                                    )}
                                                </h3>
                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${isActive
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                    }`}>
                                                    {isActive ? 'Đang hoạt động' : 'Đã hết hạn'}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(promotion)}
                                                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedPromotion(promotion);
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
                                            <div className="flex items-center gap-2 text-yellow-400">
                                                <Percent className="w-4 h-4" />
                                                <span className="text-2xl font-bold">
                                                    {promotion.discount}%
                                                </span>
                                                <span className="text-sm text-white/70">giảm giá</span>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-white/70">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        {new Date(promotion.startDate).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white/70">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        {new Date(promotion.endDate).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-white/10">
                                                <div className="text-xs text-white/50 font-mono">
                                                    ID: {promotion.promoID}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {selectedPromotion ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
                                </h2>
                                <button onClick={closeModal} className="text-white/70 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Mã khuyến mãi *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                        placeholder="Nhập mã khuyến mãi"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Phần trăm giảm giá (%) *</label>
                                    <input
                                        type="number"
                                        value={formData.discount}
                                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập phần trăm giảm giá"
                                        step="1"
                                        min="1"
                                        max="100"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Ngày bắt đầu *</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Ngày kết thúc *</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
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
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        {modalLoading ? 'Đang xử lý...' : selectedPromotion ? 'Cập nhật' : 'Thêm mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && selectedPromotion && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa</h3>
                                <p className="text-white/70 mb-6">
                                    Bạn có chắc chắn muốn xóa khuyến mãi <strong className="text-white">{selectedPromotion.code}</strong>?
                                    <br />Hành động này không thể hoàn tác!
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setSelectedPromotion(null);
                                        }}
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => deletePromotion(selectedPromotion.promoID)}
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

export default PromotionManagement;