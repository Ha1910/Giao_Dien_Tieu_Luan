import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, RefreshCw, User, Mail, Shield, Eye, EyeOff, AlertCircle, Lock, Unlock } from 'lucide-react';
import axios from 'axios';

// Cấu hình axios
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor thêm token vào mọi request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'CUSTOMER',
        id: '' // lưu id tạm nếu cần
    });

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Helper: normalize user id (hỗ trợ id, userID, _id, userId)
    const getUserId = (u) => {
        if (!u) return undefined;
        return u.id ?? u.userID ?? u._id ?? u.userId ?? undefined;
    };

    // Fetch users - ĐÃ SỬA: Dùng endpoint đúng từ API guide
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            // Sử dụng endpoint từ API guide: /api/admin/users
            const response = await api.get('/admin/users');
            console.log('✅ Users data:', response.data);
            setUsers(response.data || []);
        } catch (err) {
            console.error('💥 Fetch users error:', err);
            if (err.response?.status === 403) {
                setError('Bạn không có quyền truy cập danh sách người dùng!');
            } else if (err.response?.status === 401) {
                setError('Vui lòng đăng nhập lại!');
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else {
                setError('Không thể tải danh sách người dùng: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    // Create user - SỬA: gửi payload đúng theo API guide {name,email,password,role}
    const createUser = async (userData) => {
        setModalLoading(true);
        setError('');
        try {
            // Chuẩn payload theo API guide: { name, email, password, role }
            const payload = {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                role: userData.role
            };

            console.log('📤 Sending POST /api/auth/register with payload:', payload);

            // Dùng api để tận dụng baseURL & headers
            const response = await api.post('/auth/register', payload);

            console.log('✅ Register response:', response.status, response.data);

            // Response theo API guide trả về token + id + name + email + role
            const created = {
                id: response.data.id ?? response.data.userID ?? response.data.userId ?? undefined,
                name: response.data.name ?? payload.name,
                email: response.data.email ?? payload.email,
                role: response.data.role ?? payload.role
            };

            // Thêm user mới vào danh sách local (nếu muốn đồng bộ từ server, gọi fetchUsers() khi có token admin)
            setUsers(prevUsers => [...prevUsers, created]);

            setSuccess('Thêm người dùng thành công!');
            closeModal();
        } catch (err) {
            // Log chi tiết để biết backend trả cái gì (rất hữu ích khi nhận 400)
            console.error('Create error (full):', err);
            console.error('Create error response.data:', err.response?.data);
            console.error('Create error response.status:', err.response?.status);

            // Hiển thị message cụ thể từ server nếu có, fallback sang chuỗi lỗi
            const errorMessage =
                err.response?.data?.message
                || (typeof err.response?.data === 'string' ? err.response.data : undefined)
                || err.message
                || 'Lỗi khi thêm người dùng!';
            setError(errorMessage);
        } finally {
            setModalLoading(false);
        }
    };

    // Update user - SỬA: dùng getUserId để so khớp chính xác
    const updateUser = async (userId, userData) => {
        setModalLoading(true);
        try {
            // Nếu backend admin endpoint là /admin/users/:id thì dùng /admin/users/:id
            // Thay đổi dưới đây nếu API của bạn khác
            const response = await api.put(`/admin/users/${userId}`, userData);
            setUsers(prevUsers => prevUsers.map(u => (getUserId(u) === userId ? response.data : u)));
            setSuccess('Cập nhật người dùng thành công!');
            closeModal();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật người dùng!';
            setError(errorMessage);
            console.error('Update error:', err);
        } finally {
            setModalLoading(false);
        }
    };

    // Delete user - SỬA: dùng getUserId khi filter
    const deleteUser = async (userId) => {
        setModalLoading(true);
        setError('');

        try {
            // Nếu backend admin endpoint là /admin/users/:id thì dùng /admin/users/:id
            await api.delete(`/admin/users/${userId}`);

            setUsers(prevUsers => prevUsers.filter(u => getUserId(u) !== userId));
            setSuccess('Đã xóa người dùng thành công!');
            setShowDeleteModal(false);
            setSelectedUser(null);

        } catch (err) {
            console.error('Delete error:', err);

            let errorMessage = 'Lỗi khi xóa người dùng!';
            if (err.response?.status === 403) {
                errorMessage = 'Bạn không có quyền xóa người dùng này!';
            } else if (err.response?.status === 404) {
                errorMessage = 'Không tìm thấy người dùng!';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }

            setError(errorMessage);
        } finally {
            setModalLoading(false);
        }
    };

    // Update user role - THÊM MỚI: Chức năng cập nhật role từ API guide
    const updateUserRole = async (userId, newRole) => {
        try {
            // endpoint admin role (dùng PUT với query param theo code gốc)
            await api.put(`/admin/users/${userId}/role?role=${newRole}`);
            setUsers(prevUsers => prevUsers.map(u =>
                (getUserId(u) === userId) ? { ...u, role: newRole } : u
            ));
            setSuccess(`Đã cập nhật vai trò thành ${newRole}!`);
        } catch (err) {
            setError('Lỗi khi cập nhật vai trò: ' + (err.response?.data?.message || err.message));
        }
    };

    // Update user status - THÊM MỚI
    const updateUserStatus = async (userId, newStatus) => {
        try {
            await api.put(`/admin/users/${userId}/status`, { status: newStatus });
            setUsers(prevUsers => prevUsers.map(u =>
                (getUserId(u) === userId) ? { ...u, status: newStatus } : u
            ));
            setSuccess(`Đã ${newStatus === 'SUSPENDED' ? 'khóa' : 'mở khóa'} tài khoản!`);
        } catch (err) {
            setError('Lỗi khi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
        }
    };

    // Search users - THÊM MỚI
    const searchUsers = async (keyword) => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/users/search?keyword=${encodeURIComponent(keyword)}`);
            setUsers(response.data || []);
        } catch (err) {
            console.error('Search users error:', err);
            setError('Lỗi khi tìm kiếm người dùng: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Get user details - THÊM MỚI
    const getUserDetails = async (userId) => {
        try {
            const response = await api.get(`/admin/users/${userId}`);
            return response.data;
        } catch (err) {
            console.error('Get user details error:', err);
            setError('Lỗi khi lấy thông tin chi tiết: ' + (err.response?.data?.message || err.message));
            return null;
        }
    };

    // Handle search - THÊM MỚI
    const handleSearch = () => {
        if (searchTerm.trim()) {
            searchUsers(searchTerm);
        } else {
            fetchUsers(); // Load lại toàn bộ nếu search rỗng
        }
    };

    // Handle search key press - THÊM MỚI
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Handle submit - ĐÃ SỬA: dùng getUserId(selectedUser)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name.trim() || !formData.email.trim()) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc!');
            return;
        }

        if (!selectedUser && !formData.password) {
            setError('Vui lòng nhập mật khẩu cho người dùng mới!');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Email không hợp lệ!');
            return;
        }

        const userData = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            role: formData.role
        };

        if (formData.password) {
            userData.password = formData.password;
        }

        console.log('📤 Submitting user data:', userData);

        if (selectedUser) {
            const uid = getUserId(selectedUser);
            if (!uid) {
                setError('Không tìm thấy ID người dùng để cập nhật.');
                return;
            }
            await updateUser(uid, userData);
        } else {
            await createUser(userData);
        }
    };

    // Open modal for edit - SỬA: lưu id vào formData để an toàn
    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            id: getUserId(user) || '',
            name: user.name || '',
            email: user.email || '',
            password: '',
            role: user.role || 'CUSTOMER'
        });
        setShowModal(true);
        setError('');
    };

    // Open modal for create
    const openCreateModal = () => {
        setSelectedUser(null);
        setFormData({
            id: '',
            name: '',
            email: '',
            password: '',
            role: 'CUSTOMER'
        });
        setShowModal(true);
        setError('');
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setFormData({ id: '', name: '', email: '', password: '', role: 'CUSTOMER' });
        setShowPassword(false);
        setError('');
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === '' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Get role badge
    const getRoleBadge = (role) => {
        const colors = {
            ADMIN: 'bg-red-500/20 text-red-300 border-red-500/30',
            STAFF: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            CUSTOMER: 'bg-green-500/20 text-green-300 border-green-500/30',
            GUEST: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[role] || colors.CUSTOMER}`}>
                {role}
            </span>
        );
    };

    // Get status badge - THÊM MỚI
    const getStatusBadge = (status) => {
        const colors = {
            ACTIVE: 'bg-green-500/20 text-green-300 border-green-500/30',
            SUSPENDED: 'bg-red-500/20 text-red-300 border-red-500/30',
            INACTIVE: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        };
        const labels = {
            ACTIVE: 'Hoạt động',
            SUSPENDED: 'Đã khóa',
            INACTIVE: 'Không hoạt động'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors.INACTIVE}`}>
                {labels[status] || status}
            </span>
        );
    };

    // Quick role update dropdown - THÊM MỚI
    const RoleUpdateDropdown = ({ user, onRoleUpdate }) => {
        const [isOpen, setIsOpen] = useState(false);

        const handleRoleChange = async (newRole) => {
            const uid = getUserId(user);
            if (!uid) {
                setError('Không có ID để cập nhật vai trò.');
                return;
            }
            await onRoleUpdate(uid, newRole);
            setIsOpen(false);
        };

        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
                    title="Thay đổi vai trò"
                >
                    <Shield className="w-4 h-4" />
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-white/20 rounded-lg shadow-lg z-10">
                        <button
                            onClick={() => handleRoleChange('ADMIN')}
                            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-red-500/20 transition-colors"
                        >
                            ADMIN
                        </button>
                        <button
                            onClick={() => handleRoleChange('STAFF')}
                            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-blue-500/20 transition-colors"
                        >
                            STAFF
                        </button>
                        <button
                            onClick={() => handleRoleChange('CUSTOMER')}
                            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-green-500/20 transition-colors"
                        >
                            CUSTOMER
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Status toggle button - THÊM MỚI
    const StatusToggleButton = ({ user, onStatusUpdate }) => {
        const currentStatus = user.status || 'ACTIVE';
        const isActive = currentStatus === 'ACTIVE';

        const handleToggle = async () => {
            const uid = getUserId(user);
            if (!uid) {
                setError('Không có ID để cập nhật trạng thái.');
                return;
            }
            await onStatusUpdate(uid, isActive ? 'SUSPENDED' : 'ACTIVE');
        };

        return (
            <button
                onClick={handleToggle}
                className={`p-1 rounded-lg transition-colors ${isActive
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                        : 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
                    }`}
                title={isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
            >
                {isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
        );
    };

    // Stats
    const stats = {
        total: users.length,
        admin: users.filter(u => u.role === 'ADMIN').length,
        staff: users.filter(u => u.role === 'STAFF').length,
        customer: users.filter(u => u.role === 'CUSTOMER').length,
        active: users.filter(u => (u.status || 'ACTIVE') === 'ACTIVE').length,
        suspended: users.filter(u => u.status === 'SUSPENDED').length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                <User className="w-10 h-10" />
                                Quản Lý Người Dùng
                            </h1>
                            <p className="text-white/70 mt-2">Quản lý tài khoản và phân quyền hệ thống</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchUsers}
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
                                Thêm người dùng
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
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/30">
                        <div className="text-2xl font-bold text-blue-300">{stats.total}</div>
                        <div className="text-blue-200 text-sm mt-1">Tổng số</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-lg rounded-xl p-4 border border-red-500/30">
                        <div className="text-2xl font-bold text-red-300">{stats.admin}</div>
                        <div className="text-red-200 text-sm mt-1">Quản trị</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-4 border border-purple-500/30">
                        <div className="text-2xl font-bold text-purple-300">{stats.staff}</div>
                        <div className="text-purple-200 text-sm mt-1">Nhân viên</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-4 border border-green-500/30">
                        <div className="text-2xl font-bold text-green-300">{stats.customer}</div>
                        <div className="text-green-200 text-sm mt-1">Khách hàng</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-lg rounded-xl p-4 border border-emerald-500/30">
                        <div className="text-2xl font-bold text-emerald-300">{stats.active}</div>
                        <div className="text-emerald-200 text-sm mt-1">Đang hoạt động</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-lg rounded-xl p-4 border border-orange-500/30">
                        <div className="text-2xl font-bold text-orange-300">{stats.suspended}</div>
                        <div className="text-orange-200 text-sm mt-1">Đã khóa</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex items-center gap-2 mb-4 text-white">
                        <Search className="w-5 h-5" />
                        <h2 className="text-xl font-bold">Tìm kiếm & Lọc</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Tìm theo tên hoặc email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleSearchKeyPress}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả vai trò</option>
                                <option value="ADMIN">Quản trị viên</option>
                                <option value="STAFF">Nhân viên</option>
                                <option value="CUSTOMER">Khách hàng</option>
                                <option value="GUEST">Khách vãng lai</option>
                            </select>
                        </div>
                        <div>
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Search className="w-5 h-5" />
                                Tìm kiếm
                            </button>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Danh sách người dùng ({filteredUsers.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-white/70">Đang tải dữ liệu...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center">
                            <User className="w-16 h-16 text-white/30 mx-auto mb-4" />
                            <p className="text-white/70">Không tìm thấy người dùng nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="text-left p-4 text-white font-semibold">ID</th>
                                        <th className="text-left p-4 text-white font-semibold">Họ tên</th>
                                        <th className="text-left p-4 text-white font-semibold">Email</th>
                                        <th className="text-left p-4 text-white font-semibold">Vai trò</th>
                                        <th className="text-left p-4 text-white font-semibold">Trạng thái</th>
                                        <th className="text-center p-4 text-white font-semibold">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => {
                                        const uid = getUserId(user) || 'unknown';
                                        const status = user.status || 'ACTIVE';
                                        return (
                                            <tr key={uid} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-white/80 font-mono text-sm">{uid}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                                        </div>
                                                        <span className="text-white font-medium">{user.name || 'Chưa có tên'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-white/70">
                                                        <Mail className="w-4 h-4" />
                                                        {user.email}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {getRoleBadge(user.role)}
                                                        <RoleUpdateDropdown
                                                            user={user}
                                                            onRoleUpdate={updateUserRole}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(status)}
                                                        <StatusToggleButton
                                                            user={user}
                                                            onStatusUpdate={updateUserStatus}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowDeleteModal(true);
                                                            }}
                                                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {selectedUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
                                </h2>
                                <button onClick={closeModal} className="text-white/70 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Họ tên *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập họ tên"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập email"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">
                                        {selectedUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                                            placeholder={selectedUser ? 'Nhập mật khẩu mới' : 'Nhập mật khẩu'}
                                            required={!selectedUser}
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2 text-sm font-medium">Vai trò *</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="CUSTOMER">Khách hàng</option>
                                        <option value="STAFF">Nhân viên</option>
                                        <option value="ADMIN">Quản trị viên</option>
                                        <option value="GUEST">Khách vãng lai</option>
                                    </select>
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
                                        {modalLoading ? 'Đang xử lý...' : selectedUser ? 'Cập nhật' : 'Thêm mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal - ĐÃ SỬA */}
                {showDeleteModal && selectedUser && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa</h3>
                                <p className="text-white/70 mb-6">
                                    Bạn có chắc chắn muốn xóa người dùng <strong className="text-white">{selectedUser.name}</strong>?
                                    <br />Hành động này không thể hoàn tác!
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setSelectedUser(null);
                                        }}
                                        disabled={modalLoading}
                                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => {
                                            const uid = getUserId(selectedUser);
                                            if (!uid) {
                                                setError('Không có ID để xóa người dùng này.');
                                                return;
                                            }
                                            deleteUser(uid);
                                        }}
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

export default UserManagement;