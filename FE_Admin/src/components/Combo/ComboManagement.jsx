import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, RefreshCw, Package, DollarSign, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ComboManagement = () => {
    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCombo, setSelectedCombo] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        nameCombo: '',
        price: '',
        description: ''
    });

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');

    const API_BASE_URL = 'http://localhost:8080/api/combos';

    // Get token từ localStorage hoặc context
    const getAuthToken = () => {
        return localStorage.getItem('token') || '';
    };

    // Fetch combos - ĐÃ SỬA ĐÚNG API
    const fetchCombos = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('🔄 Đang gọi API combos...');

            const response = await axios.get(API_BASE_URL, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('✅ Response status:', response.status);
            console.log('✅ Response data:', response.data);

            if (response.data && Array.isArray(response.data)) {
                setCombos(response.data);
                if (response.data.length > 0) {
                    setSuccess(`Đã tải ${response.data.length} combo thành công!`);
                    setTimeout(() => setSuccess(''), 3000);
                }
            } else {
                throw new Error('Dữ liệu trả về không hợp lệ');
            }

        } catch (err) {
            console.error('💥 Lỗi fetch combos:', err);
            handleApiError(err, 'tải danh sách combo');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý lỗi API
    const handleApiError = (err, action) => {
        if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
            setError('❌ Không thể kết nối đến server. Kiểm tra: 1) Backend có đang chạy? 2) Port 8080 có bị block?');
        } else if (err.response?.status === 401) {
            setError('🔐 Unauthorized: Token không hợp lệ hoặc đã hết hạn');
        } else if (err.response?.status === 403) {
            setError('🚫 Forbidden: Bạn không có quyền thực hiện hành động này');
        } else if (err.response?.status === 404) {
            setError('🔍 Endpoint không tồn tại. Kiểm tra route /api/combos trong controller');
        } else if (err.response?.status === 500) {
            setError('⚡ Lỗi server. Kiểm tra console backend để biết chi tiết');
        } else {
            setError(`Lỗi khi ${action}: ${err.response?.data?.message || err.message}`);
        }
    };

    // Create combo - ĐÃ SỬA VỚI AUTH HEADER
    const createCombo = async (comboData) => {
        setModalLoading(true);
        setError('');
        try {
            const token = getAuthToken();
            if (!token) {
                setError('Token authentication không tồn tại. Vui lòng đăng nhập lại.');
                return;
            }

            const response = await axios.post(API_BASE_URL, comboData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            setCombos(prevCombos => [...prevCombos, response.data]);
            setSuccess('Thêm combo thành công!');
            closeModal();
            fetchCombos(); // Refresh list
        } catch (err) {
            handleApiError(err, 'thêm combo');
        } finally {
            setModalLoading(false);
        }
    };

    // Update combo - ĐÃ SỬA VỚI AUTH HEADER
    const updateCombo = async (comboId, comboData) => {
        setModalLoading(true);
        setError('');
        try {
            const token = getAuthToken();
            if (!token) {
                setError('Token authentication không tồn tại. Vui lòng đăng nhập lại.');
                return;
            }

            const response = await axios.put(`${API_BASE_URL}/${comboId}`, comboData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            setCombos(prevCombos => prevCombos.map(c => c.comboID === comboId ? response.data : c));
            setSuccess('Cập nhật combo thành công!');
            closeModal();
        } catch (err) {
            handleApiError(err, 'cập nhật combo');
        } finally {
            setModalLoading(false);
        }
    };

    // Delete combo - ĐÃ SỬA VỚI AUTH HEADER
    const deleteCombo = async (comboId) => {
        setModalLoading(true);
        setError('');

        try {
            const token = getAuthToken();
            if (!token) {
                setError('Token authentication không tồn tại. Vui lòng đăng nhập lại.');
                return;
            }

            await axios.delete(`${API_BASE_URL}/${comboId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setCombos(prevCombos => prevCombos.filter(c => c.comboID !== comboId));
            setSuccess('Đã xóa combo thành công!');
            setShowDeleteModal(false);
            setSelectedCombo(null);

        } catch (err) {
            handleApiError(err, 'xóa combo');
        } finally {
            setModalLoading(false);
        }
    };

    // Search combos - ĐÃ SỬA ĐÚNG ENDPOINT
    const searchCombos = async () => {
        if (!searchTerm.trim()) {
            fetchCombos();
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/search?name=${encodeURIComponent(searchTerm)}`, {
                headers: {
                    'Content-Type': 'application/json',
                    // Thêm auth nếu search yêu cầu authentication
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (response.data && Array.isArray(response.data)) {
                setCombos(response.data);
                if (response.data.length === 0) {
                    setSuccess('Không tìm thấy combo nào phù hợp');
                    setTimeout(() => setSuccess(''), 3000);
                }
            } else {
                throw new Error('Dữ liệu tìm kiếm không hợp lệ');
            }
        } catch (err) {
            handleApiError(err, 'tìm kiếm combo');
        } finally {
            setLoading(false);
        }
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.nameCombo.trim()) {
            setError('Vui lòng nhập tên combo!');
            return;
        }

        if (!formData.price || parseFloat(formData.price) <= 0) {
            setError('Vui lòng nhập giá hợp lệ!');
            return;
        }

        const submitData = {
            nameCombo: formData.nameCombo.trim(),
            price: parseFloat(formData.price),
            description: formData.description.trim() || ''
        };

        console.log('📤 Gửi dữ liệu:', submitData);

        if (selectedCombo) {
            await updateCombo(selectedCombo.comboID, submitData);
        } else {
            await createCombo(submitData);
        }
    };

    const openEditModal = (combo) => {
        setSelectedCombo(combo);
        setFormData({
            nameCombo: combo.nameCombo || '',
            price: combo.price?.toString() || '',
            description: combo.description || ''
        });
        setShowModal(true);
        setError('');
    };

    const openCreateModal = () => {
        setSelectedCombo(null);
        setFormData({
            nameCombo: '',
            price: '',
            description: ''
        });
        setShowModal(true);
        setError('');
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCombo(null);
        setFormData({ nameCombo: '', price: '', description: '' });
        setError('');
    };

    // Handle search input key press
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            searchCombos();
        }
    };

    // Clear search and reload all combos
    const clearSearch = () => {
        setSearchTerm('');
        fetchCombos();
    };

    // Load data khi component mount
    useEffect(() => {
        fetchCombos();
    }, []);

    // Filter combos for display (client-side filtering as fallback)
    const filteredCombos = combos.filter(combo => {
        const searchLower = searchTerm.toLowerCase();
        return combo.nameCombo?.toLowerCase().includes(searchLower) ||
            combo.description?.toLowerCase().includes(searchLower);
    });

    // Stats
    const stats = {
        total: combos.length,
        totalValue: combos.reduce((sum, combo) => sum + (combo.price || 0), 0),
        averagePrice: combos.length > 0 ?
            combos.reduce((sum, combo) => sum + (combo.price || 0), 0) / combos.length : 0
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                <Package className="w-10 h-10" />
                                Quản Lý Combo
                            </h1>
                            <p className="text-white/70 mt-2">Quản lý các gói combo đồ ăn và thức uống</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchCombos}
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
                                Thêm combo
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-6 border border-blue-500/30">
                        <div className="text-3xl font-bold text-blue-300">{stats.total}</div>
                        <div className="text-blue-200 text-sm mt-1">Tổng số combo</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                        <div className="text-3xl font-bold text-purple-300">
                            {stats.totalValue.toLocaleString('vi-VN')}₫
                        </div>
                        <div className="text-purple-200 text-sm mt-1">Tổng giá trị</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30">
                        <div className="text-3xl font-bold text-green-300">
                            {Math.round(stats.averagePrice).toLocaleString('vi-VN')}₫
                        </div>
                        <div className="text-green-200 text-sm mt-1">Giá trung bình</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex items-center gap-2 mb-4 text-white">
                        <Search className="w-5 h-5" />
                        <h2 className="text-xl font-bold">Tìm kiếm Combo</h2>
                    </div>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc mô tả..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={searchCombos}
                            disabled={loading}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            <Search className="w-5 h-5" />
                            Tìm kiếm
                        </button>
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                                Xóa
                            </button>
                        )}
                    </div>
                </div>

                {/* Combos Grid */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Danh sách combo ({filteredCombos.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-white/70">Đang tải dữ liệu...</p>
                        </div>
                    ) : filteredCombos.length === 0 ? (
                        <div className="p-12 text-center">
                            <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
                            <p className="text-white/70">
                                {searchTerm ? 'Không tìm thấy combo phù hợp' : 'Chưa có combo nào'}
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                                >
                                    Xóa tìm kiếm
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {filteredCombos.map((combo) => (
                                <div key={combo.comboID} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-white truncate flex-1 mr-3">
                                            {combo.nameCombo}
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(combo)}
                                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedCombo(combo);
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
                                        <div className="flex items-center gap-2 text-green-400">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="text-2xl font-bold">
                                                {combo.price?.toLocaleString('vi-VN')}₫
                                            </span>
                                        </div>

                                        {combo.description && (
                                            <div className="flex items-start gap-2 text-white/70">
                                                <FileText className="w-4 h-4 mt-1 flex-shrink-0" />
                                                <p className="text-sm leading-relaxed line-clamp-3">
                                                    {combo.description}
                                                </p>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t border-white/10">
                                            <div className="text-xs text-white/50 font-mono">
                                                ID: {combo.comboID}
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
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {selectedCombo ? 'Chỉnh sửa combo' : 'Thêm combo mới'}
                                </h2>
                                <button onClick={closeModal} className="text-white/70 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Tên combo *</label>
                                    <input
                                        type="text"
                                        value={formData.nameCombo}
                                        onChange={(e) => setFormData({ ...formData, nameCombo: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập tên combo"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Giá (VNĐ) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập giá"
                                        step="1000"
                                        min="0"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="4"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        placeholder="Nhập mô tả combo"
                                        maxLength="1000"
                                    />
                                    <div className="text-right text-xs text-white/50 mt-1">
                                        {formData.description.length}/1000 ký tự
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
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        {modalLoading ? 'Đang xử lý...' : selectedCombo ? 'Cập nhật' : 'Thêm mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && selectedCombo && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa</h3>
                                <p className="text-white/70 mb-6">
                                    Bạn có chắc chắn muốn xóa combo <strong className="text-white">{selectedCombo.nameCombo}</strong>?
                                    <br />Hành động này không thể hoàn tác!
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setSelectedCombo(null);
                                        }}
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => deleteCombo(selectedCombo.comboID)}
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

export default ComboManagement;