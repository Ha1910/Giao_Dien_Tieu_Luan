import React, { useState, useEffect } from 'react';
import {
    Ticket,
    User,
    Film,
    Clock,
    MapPin,
    Search,
    Filter,
    RefreshCw,
    Eye,
    X,
    AlertCircle,
    Calendar,
    DollarSign,
    BarChart3,
    Users,
    TrendingUp,
    Shield,
    Ban,
    Download,
    Plus,
    CreditCard,
    CheckCircle
} from 'lucide-react';
import axios from 'axios';

const TicketManagement = () => {
    const [tickets, setTickets] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showBookModal, setShowBookModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [activeTab, setActiveTab] = useState('my'); // 'my', 'all', 'admin'

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    // Book ticket form: note we use price (API expects price), not customerId
    const [bookForm, setBookForm] = useState({
        showtimeId: '',
        seatId: '',
        price: ''
    });

    const API_BASE_URL = 'http://localhost:8080/api/tickets';
    const ADMIN_API_URL = 'http://localhost:8080/api/admin/tickets';

    // Lấy JWT token
    const getAuthToken = () => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    };

    // Luôn trả headers object (thêm Content-Type)
    const getAuthConfig = () => {
        const token = getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        return { headers };
    };

    // Kiểm tra đăng nhập
    const isLoggedIn = () => {
        return !!getAuthToken();
    };

    // Kiểm tra admin (giả định)
    const isAdmin = () => {
        // Trong thực tế, cần kiểm tra role từ token
        return localStorage.getItem('userRole') === 'ADMIN';
    };

    // Lấy vé của tôi
    const fetchMyTickets = async () => {
        if (!isLoggedIn()) {
            setError('Vui lòng đăng nhập để xem vé của bạn');
            return;
        }

        setLoading(true);
        setError('');
        try {
            console.log('🎫 Fetching my tickets...');
            const response = await axios.get(`${API_BASE_URL}/my-tickets`, getAuthConfig());

            if (response.data && Array.isArray(response.data)) {
                setMyTickets(response.data);
                setSuccess(`✅ Đã tải ${response.data.length} vé của bạn!`);
                console.log('✅ My tickets loaded:', response.data.length);
            }
        } catch (err) {
            console.error('💥 Lỗi fetch my tickets:', err);
            if (err.response?.status === 403 || err.response?.status === 401) {
                setError('Không có quyền truy cập. Vui lòng đăng nhập lại.');
            } else {
                setError('Không thể tải vé của bạn: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    // Lấy tất cả vé (Admin only)
    const fetchAllTickets = async () => {
        if (!isAdmin()) {
            setError('Chỉ admin mới có quyền xem tất cả vé');
            return;
        }

        setLoading(true);
        setError('');
        try {
            console.log('🎫 Fetching all tickets (Admin)...');
            const response = await axios.get(ADMIN_API_URL, getAuthConfig());

            if (response.data && Array.isArray(response.data)) {
                setTickets(response.data);
                setSuccess(`✅ Đã tải ${response.data.length} vé từ hệ thống!`);
                console.log('✅ All tickets loaded:', response.data.length);
            }
        } catch (err) {
            console.error('💥 Lỗi fetch all tickets:', err);
            if (err.response?.status === 403) {
                setError('Không có quyền admin để xem tất cả vé');
            } else {
                setError('Không thể tải dữ liệu vé: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    // Đặt vé mới (sửa: gửi price thay vì customerId)
    const bookTicket = async (bookData) => {
        setModalLoading(true);
        try {
            // Ép kiểu an toàn
            const showtimeId = Number(bookData.showtimeId);
            const seatId = Number(bookData.seatId);
            const price = Number(bookData.price);

            // Kiểm tra NaN
            if (!Number.isFinite(showtimeId) || !Number.isFinite(seatId) || !Number.isFinite(price)) {
                throw new Error('Dữ liệu không hợp lệ: ID và giá phải là số');
            }

            const payload = {
                showtimeId,
                seatId,
                price
            };

            console.log('📤 Booking ticket payload:', payload);
            const response = await axios.post(`${API_BASE_URL}/book`, payload, getAuthConfig());
            console.log('✅ Book response:', response.status, response.data);

            // Cập nhật danh sách vé
            if (activeTab === 'my') {
                setMyTickets(prev => [...prev, response.data]);
            } else if (activeTab === 'all') {
                setTickets(prev => [...prev, response.data]);
            }

            setSuccess('✅ Đặt vé thành công!');
            setShowBookModal(false);
            setBookForm({ showtimeId: '', seatId: '', price: '' });

        } catch (err) {
            console.error('💥 Lỗi book ticket full error object:', err);
            const status = err.response?.status;
            const serverData = err.response?.data;
            console.error('Server status:', status);
            console.error('Server response data:', serverData);

            const errorMessage = serverData?.message || (typeof serverData === 'string' ? serverData : err.message);

            if (status === 400) {
                setError('❌ Lỗi khi đặt vé: ' + errorMessage);
            } else if (status === 403 || status === 401) {
                setError('❌ Không có quyền thực hiện hành động này');
            } else {
                setError('❌ Lỗi khi đặt vé: ' + errorMessage);
            }
        } finally {
            setModalLoading(false);
        }
    };

    // Hủy vé
    const cancelTicket = async (ticketId) => {
        setModalLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/${ticketId}/cancel`, {}, getAuthConfig());

            // Cập nhật local state
            const updateTicketStatus = (ticketList) =>
                ticketList.map(ticket =>
                    ticket.ticketID === ticketId
                        ? { ...ticket, status: 'CANCELLED' }
                        : ticket
                );

            if (activeTab === 'my') {
                setMyTickets(updateTicketStatus);
            } else if (activeTab === 'all') {
                setTickets(updateTicketStatus);
            }

            setSuccess('✅ Hủy vé thành công!');
            setShowCancelModal(false);
            setSelectedTicket(null);
        } catch (err) {
            setError('❌ Lỗi khi hủy vé: ' + (err.response?.data?.message || err.message));
        } finally {
            setModalLoading(false);
        }
    };

    // Lấy thông tin vé chi tiết
    const viewTicketDetails = async (ticketId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/${ticketId}`, getAuthConfig());
            setSelectedTicket(response.data);
            setShowModal(true);
        } catch (err) {
            setError('❌ Lỗi khi lấy thông tin vé: ' + (err.response?.data?.message || err.message));
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Format datetime
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    // Lấy class cho trạng thái
    const getStatusClass = (status) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'CANCELLED': return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'USED': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'EXPIRED': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    // Lấy text hiển thị trạng thái
    const getStatusText = (status) => {
        switch (status) {
            case 'ACTIVE': return 'Đang hoạt động';
            case 'CANCELLED': return 'Đã hủy';
            case 'USED': return 'Đã sử dụng';
            case 'EXPIRED': return 'Đã hết hạn';
            default: return status || 'Không xác định';
        }
    };

    // Tính toán thống kê
    const getStats = () => {
        const currentTickets = activeTab === 'my' ? myTickets : tickets;

        return {
            total: currentTickets.length,
            active: currentTickets.filter(ticket => ticket.status === 'ACTIVE').length,
            cancelled: currentTickets.filter(ticket => ticket.status === 'CANCELLED').length,
            used: currentTickets.filter(ticket => ticket.status === 'USED').length,
            expired: currentTickets.filter(ticket => ticket.status === 'EXPIRED').length,
            totalRevenue: currentTickets
                .filter(ticket => ticket.status === 'ACTIVE' || ticket.status === 'USED')
                .reduce((sum, ticket) => sum + (ticket.price || 0), 0)
        };
    };

    // Lọc vé
    const getFilteredTickets = () => {
        const currentTickets = activeTab === 'my' ? myTickets : tickets;

        return currentTickets.filter(ticket => {
            const matchesSearch =
                ticket.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.showtime?.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.room?.roomName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.seat?.seatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.ticketID?.toString().includes(searchTerm);

            const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;

            const matchesDate = !filterDate ||
                (ticket.bookingDate && ticket.bookingDate.includes(filterDate)) ||
                (ticket.showtime?.showtimeDate && ticket.showtime.showtimeDate.includes(filterDate));

            return matchesSearch && matchesStatus && matchesDate;
        });
    };

    // Handle search input key press
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (activeTab === 'my') {
                fetchMyTickets();
            } else if (activeTab === 'all') {
                fetchAllTickets();
            }
        }
    };

    // Handle book form submit
    const handleBookSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!bookForm.showtimeId || !bookForm.seatId || !bookForm.price) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        bookTicket(bookForm);
    };

    // Load data khi tab thay đổi
    useEffect(() => {
        if (activeTab === 'my') {
            fetchMyTickets();
        } else if (activeTab === 'all' && isAdmin()) {
            fetchAllTickets();
        }
    }, [activeTab]);

    const stats = getStats();
    const filteredTickets = getFilteredTickets();
    const userIsLoggedIn = isLoggedIn();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                <Ticket className="w-10 h-10" />
                                Quản Lý Vé
                            </h1>
                            <p className="text-white/70 mt-2">
                                {activeTab === 'my' ? 'Quản lý vé của bạn' :
                                    activeTab === 'all' ? 'Quản lý toàn bộ vé hệ thống (Admin)' : ''}
                            </p>
                            {!userIsLoggedIn && (
                                <p className="text-yellow-400 text-sm mt-1">
                                    ⚠️ Vui lòng đăng nhập để sử dụng chức năng
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={activeTab === 'my' ? fetchMyTickets : fetchAllTickets}
                                disabled={loading}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Đang tải...' : 'Làm mới'}
                            </button>
                            {userIsLoggedIn && activeTab === 'my' && (
                                <button
                                    onClick={() => setShowBookModal(true)}
                                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                    Đặt vé mới
                                </button>
                            )}
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

                {/* Tabs */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex border-b border-white/10 mb-4">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`px-4 py-2 font-medium transition-all ${activeTab === 'my'
                                ? 'text-white border-b-2 border-blue-500'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            <User className="w-4 h-4 inline mr-2" />
                            Vé của tôi ({myTickets.length})
                        </button>
                        {isAdmin() && (
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 font-medium transition-all ${activeTab === 'all'
                                    ? 'text-white border-b-2 border-purple-500'
                                    : 'text-white/60 hover:text-white'
                                    }`}
                            >
                                <Shield className="w-4 h-4 inline mr-2" />
                                Tất cả vé ({tickets.length})
                            </button>
                        )}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/30">
                            <div className="text-2xl font-bold text-blue-300">{stats.total}</div>
                            <div className="text-blue-200 text-sm">Tổng vé</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-4 border border-green-500/30">
                            <div className="text-2xl font-bold text-green-300">{stats.active}</div>
                            <div className="text-green-200 text-sm">Đang hoạt động</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-lg rounded-xl p-4 border border-red-500/30">
                            <div className="text-2xl font-bold text-red-300">{stats.cancelled}</div>
                            <div className="text-red-200 text-sm">Đã hủy</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-4 border border-purple-500/30">
                            <div className="text-2xl font-bold text-purple-300">{stats.used}</div>
                            <div className="text-purple-200 text-sm">Đã sử dụng</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-lg rounded-xl p-4 border border-orange-500/30">
                            <div className="text-2xl font-bold text-orange-300">{stats.expired}</div>
                            <div className="text-orange-200 text-sm">Hết hạn</div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-lg rounded-xl p-4 border border-yellow-500/30">
                            <div className="text-2xl font-bold text-yellow-300">
                                {formatCurrency(stats.totalRevenue)}
                            </div>
                            <div className="text-yellow-200 text-sm">Doanh thu</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 mb-4 text-white">
                        <Filter className="w-5 h-5" />
                        <h2 className="text-xl font-bold">Tìm kiếm & Lọc</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Tìm theo mã vé, tên, email, phim, phòng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="ACTIVE">Đang hoạt động</option>
                            <option value="CANCELLED">Đã hủy</option>
                            <option value="USED">Đã sử dụng</option>
                            <option value="EXPIRED">Đã hết hạn</option>
                        </select>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={activeTab === 'my' ? fetchMyTickets : fetchAllTickets}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            <Search className="w-5 h-5" />
                            Tìm kiếm
                        </button>
                    </div>
                </div>

                {/* Tickets Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Ticket className="w-5 h-5" />
                            {activeTab === 'my' ? 'Vé của tôi' : 'Tất cả vé'} ({filteredTickets.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-white/70">Đang tải dữ liệu vé...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-12 text-center">
                            <Ticket className="w-16 h-16 text-white/30 mx-auto mb-4" />
                            <p className="text-white/70">
                                {searchTerm || filterStatus !== 'all' || filterDate ?
                                    'Không tìm thấy vé phù hợp' :
                                    activeTab === 'my' ?
                                        'Bạn chưa có vé nào. Hãy đặt vé đầu tiên!' :
                                        'Chưa có vé nào trong hệ thống'
                                }
                            </p>
                            {(searchTerm || filterStatus !== 'all' || filterDate) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterStatus('all');
                                        setFilterDate('');
                                    }}
                                    className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 px-4 text-white/70 font-semibold">Mã vé</th>
                                            {activeTab === 'all' && (
                                                <th className="text-left py-3 px-4 text-white/70 font-semibold">Khách hàng</th>
                                            )}
                                            <th className="text-left py-3 px-4 text-white/70 font-semibold">Phim</th>
                                            <th className="text-left py-3 px-4 text-white/70 font-semibold">Phòng - Ghế</th>
                                            <th className="text-left py-3 px-4 text-white/70 font-semibold">Suất chiếu</th>
                                            <th className="text-left py-3 px-4 text-white/70 font-semibold">Giá</th>
                                            <th className="text-left py-3 px-4 text-white/70 font-semibold">Ngày đặt</th>
                                            <th className="text-left py-3 px-4 text-white/70 font-semibold">Trạng thái</th>
                                            <th className="text-left py-3 px-4 text-white/70 font-semibold">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTickets.map((ticket) => (
                                            <tr key={ticket.ticketID} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="text-white font-mono font-bold">#{ticket.ticketID}</div>
                                                </td>
                                                {activeTab === 'all' && (
                                                    <td className="py-4 px-4">
                                                        <div className="text-white font-medium">{ticket.customer?.name}</div>
                                                        <div className="text-white/50 text-sm">{ticket.customer?.email}</div>
                                                    </td>
                                                )}
                                                <td className="py-4 px-4">
                                                    <div className="text-white font-medium">{ticket.showtime?.movie?.title}</div>
                                                    <div className="text-white/50 text-sm">{ticket.showtime?.movie?.genre}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-white font-medium">{ticket.room?.roomName}</div>
                                                    <div className="text-white/50 text-sm">Ghế: {ticket.seat?.seatNumber}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-white font-medium">{ticket.showTime}</div>
                                                    <div className="text-white/50 text-sm">{formatDate(ticket.showtime?.showtimeDate)}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-white font-bold">{formatCurrency(ticket.price)}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-white">{formatDateTime(ticket.bookingDate)}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(ticket.status)}`}>
                                                        {getStatusText(ticket.status)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => viewTicketDetails(ticket.ticketID)}
                                                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {ticket.status === 'ACTIVE' && activeTab === 'my' && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTicket(ticket);
                                                                    setShowCancelModal(true);
                                                                }}
                                                                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                                                                title="Hủy vé"
                                                            >
                                                                <Ban className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal chi tiết vé */}
            {showModal && selectedTicket && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-2xl border border-white/20 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                Chi tiết vé #{selectedTicket.ticketID}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Thông tin vé */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Ticket className="w-5 h-5" />
                                    Thông tin vé
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Mã vé:</span>
                                        <span className="text-white font-bold">#{selectedTicket.ticketID}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Giá:</span>
                                        <span className="text-white font-bold">{formatCurrency(selectedTicket.price)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Trạng thái:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusClass(selectedTicket.status)}`}>
                                            {getStatusText(selectedTicket.status)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Ngày đặt:</span>
                                        <span className="text-white">{formatDateTime(selectedTicket.bookingDate)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin khách hàng */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Thông tin khách hàng
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Tên:</span>
                                        <span className="text-white">{selectedTicket.customer?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Email:</span>
                                        <span className="text-white">{selectedTicket.customer?.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">ID:</span>
                                        <span className="text-white">#{selectedTicket.customer?.userID}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin suất chiếu */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Film className="w-5 h-5" />
                                    Thông tin suất chiếu
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Phim:</span>
                                        <span className="text-white">{selectedTicket.showtime?.movie?.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Thể loại:</span>
                                        <span className="text-white">{selectedTicket.showtime?.movie?.genre}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Suất chiếu:</span>
                                        <span className="text-white">{selectedTicket.showTime}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Ngày chiếu:</span>
                                        <span className="text-white">{formatDate(selectedTicket.showtime?.showtimeDate)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin phòng & ghế */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Phòng & Ghế
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Phòng:</span>
                                        <span className="text-white">{selectedTicket.room?.roomName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Ghế:</span>
                                        <span className="text-white font-bold">{selectedTicket.seat?.seatNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Loại ghế:</span>
                                        <span className="text-white">{selectedTicket.seat?.seatType}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 mt-6 border-t border-white/10">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                            >
                                Đóng
                            </button>
                            {selectedTicket.status === 'ACTIVE' && activeTab === 'my' && (
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setShowCancelModal(true);
                                    }}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Ban className="w-5 h-5" />
                                    Hủy vé
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal xác nhận hủy vé */}
            {showCancelModal && selectedTicket && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Ban className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Xác nhận hủy vé</h3>
                            <p className="text-white/70 mb-6">
                                Bạn có chắc chắn muốn hủy vé <strong className="text-white">#{selectedTicket.ticketID}</strong>?
                                <br />Hành động này không thể hoàn tác!
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setSelectedTicket(null);
                                    }}
                                    disabled={modalLoading}
                                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => cancelTicket(selectedTicket.ticketID)}
                                    disabled={modalLoading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {modalLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Đang hủy...
                                        </>
                                    ) : (
                                        'Xác nhận hủy'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal đặt vé mới */}
            {showBookModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                Đặt vé mới
                            </h2>
                            <button onClick={() => setShowBookModal(false)} className="text-white/70 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleBookSubmit} className="space-y-4">
                            <div>
                                <label className="block text-white/80 mb-2 text-sm font-medium">ID Suất chiếu *</label>
                                <input
                                    type="number"
                                    value={bookForm.showtimeId}
                                    onChange={(e) => setBookForm({ ...bookForm, showtimeId: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập ID suất chiếu"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-white/80 mb-2 text-sm font-medium">ID Ghế *</label>
                                <input
                                    type="number"
                                    value={bookForm.seatId}
                                    onChange={(e) => setBookForm({ ...bookForm, seatId: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập ID ghế"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-white/80 mb-2 text-sm font-medium">Giá (VND) *</label>
                                <input
                                    type="number"
                                    value={bookForm.price}
                                    onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập giá vé"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowBookModal(false)}
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
                                    <CreditCard className="w-5 h-5" />
                                    {modalLoading ? 'Đang xử lý...' : 'Đặt vé'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketManagement;