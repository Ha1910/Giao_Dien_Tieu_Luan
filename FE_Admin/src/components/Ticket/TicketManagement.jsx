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
    const [activeTab, setActiveTab] = useState('my'); // 'my', 'all'

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    // Book ticket form: supports multiple seat IDs and optional combos per API guide
    const [bookForm, setBookForm] = useState({
        showtimeId: '',
        seatIds: '',     // user types "8,9" or we can provide UI to select multiple
        comboIds: ''     // optional, "1,2" or empty
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

    // Decode simple JWT payload
    const parseJwt = (token) => {
        try {
            const payload = token.split('.')[1];
            const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
            return json;
        } catch {
            return null;
        }
    };

    // Kiểm tra đăng nhập
    const isLoggedIn = () => {
        return !!getAuthToken();
    };

    // Kiểm tra admin bằng token role
    const isAdmin = () => {
        const token = getAuthToken();
        if (!token) return false;
        const payload = parseJwt(token);
        return payload?.role === 'ADMIN' || payload?.roles?.includes?.('ADMIN') || payload?.authorities?.some?.(a => a === 'ROLE_ADMIN' || a?.authority === 'ROLE_ADMIN');
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
            const response = await axios.get(`${API_BASE_URL}/my-tickets`, getAuthConfig());
            if (response.data && Array.isArray(response.data)) {
                setMyTickets(response.data);
                setSuccess(`Đã tải ${response.data.length} vé của bạn`);
                setTimeout(() => setSuccess(''), 2500);
            } else {
                setMyTickets([]);
            }
        } catch (err) {
            console.error('fetchMyTickets error', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
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
            const response = await axios.get(ADMIN_API_URL, getAuthConfig());
            if (response.data && Array.isArray(response.data)) {
                setTickets(response.data);
                setSuccess(`Đã tải ${response.data.length} vé hệ thống`);
                setTimeout(() => setSuccess(''), 2500);
            } else {
                setTickets([]);
            }
        } catch (err) {
            console.error('fetchAllTickets error', err);
            if (err.response?.status === 403) {
                setError('Không có quyền admin để xem tất cả vé');
            } else {
                setError('Không thể tải dữ liệu vé: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    // Đặt vé mới - cập nhật theo API: gửi seatIds (mảng) và optional comboIds
    const bookTicket = async (bookData) => {
        setModalLoading(true);
        try {
            const showtimeId = Number(bookData.showtimeId);
            if (!Number.isFinite(showtimeId)) throw new Error('ID suất chiếu không hợp lệ');

            let seatIds = bookData.seatIds;
            if (!seatIds) throw new Error('Vui lòng nhập ít nhất 1 ID ghế');
            if (typeof seatIds === 'string') {
                seatIds = seatIds.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n));
            } else if (!Array.isArray(seatIds)) {
                throw new Error('seatIds phải là mảng hoặc chuỗi các ID ghế phân cách bằng dấu phẩy');
            }
            if (seatIds.length === 0) throw new Error('Vui lòng nhập ít nhất 1 ID ghế hợp lệ');

            let comboIds = bookData.comboIds;
            if (comboIds) {
                if (typeof comboIds === 'string') {
                    comboIds = comboIds.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n));
                } else if (!Array.isArray(comboIds)) {
                    comboIds = [];
                }
            } else {
                comboIds = [];
            }

            const payload = { showtimeId, seatIds };
            if (comboIds.length > 0) payload.comboIds = comboIds;

            const response = await axios.post(`${API_BASE_URL}/book`, payload, getAuthConfig());
            const data = response.data;

            if (data?.tickets && Array.isArray(data.tickets)) {
                if (activeTab === 'my') setMyTickets(prev => [...prev, ...data.tickets]);
                else if (activeTab === 'all') setTickets(prev => [...prev, ...data.tickets]);
            } else if (data && typeof data === 'object') {
                // fallback single ticket
                if (activeTab === 'my') setMyTickets(prev => [...prev, data]);
                else if (activeTab === 'all') setTickets(prev => [...prev, data]);
            }

            setSuccess('Đặt vé thành công!');
            setShowBookModal(false);
            setBookForm({ showtimeId: '', seatIds: '', comboIds: '' });
            setTimeout(() => setSuccess(''), 2500);
        } catch (err) {
            console.error('bookTicket error', err);
            const status = err.response?.status;
            const serverData = err.response?.data;
            const message = serverData?.message || (typeof serverData === 'string' ? serverData : err.message);
            if (status === 400) setError('Lỗi khi đặt vé: ' + message);
            else if (status === 401 || status === 403) setError('Không có quyền thực hiện hành động này');
            else setError('Lỗi khi đặt vé: ' + message);
        } finally {
            setModalLoading(false);
        }
    };

    // Hủy vé
    const cancelTicket = async (ticketId) => {
        setModalLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/${ticketId}/cancel`, {}, getAuthConfig());
            const updateTicketStatus = (list) => list.map(t => t.ticketID === ticketId ? { ...t, status: 'CANCELLED' } : t);
            if (activeTab === 'my') setMyTickets(prev => updateTicketStatus(prev));
            else if (activeTab === 'all') setTickets(prev => updateTicketStatus(prev));
            setSuccess('Hủy vé thành công!');
            setShowCancelModal(false);
            setSelectedTicket(null);
            setTimeout(() => setSuccess(''), 2500);
        } catch (err) {
            console.error('cancelTicket error', err);
            setError('Lỗi khi hủy vé: ' + (err.response?.data?.message || err.message));
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
            console.error('viewTicketDetails error', err);
            setError('Lỗi khi lấy thông tin vé: ' + (err.response?.data?.message || err.message));
        }
    };

    // Format helpers
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : 'N/A';
    const formatDateTime = (dateString) => dateString ? new Date(dateString).toLocaleString('vi-VN') : 'N/A';

    const getStatusClass = (status) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'CANCELLED': return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'USED': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'EXPIRED': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ACTIVE': return 'Đang hoạt động';
            case 'CANCELLED': return 'Đã hủy';
            case 'USED': return 'Đã sử dụng';
            case 'EXPIRED': return 'Đã hết hạn';
            default: return status || 'Không xác định';
        }
    };

    const getStats = () => {
        const current = activeTab === 'my' ? myTickets : tickets;
        return {
            total: current.length,
            active: current.filter(t => t.status === 'ACTIVE').length,
            cancelled: current.filter(t => t.status === 'CANCELLED').length,
            used: current.filter(t => t.status === 'USED').length,
            expired: current.filter(t => t.status === 'EXPIRED').length,
            totalRevenue: current.filter(t => t.status === 'ACTIVE' || t.status === 'USED').reduce((s, t) => s + (t.price || 0), 0)
        };
    };

    const getFilteredTickets = () => {
        const current = activeTab === 'my' ? myTickets : tickets;
        const q = searchTerm.trim().toLowerCase();
        return current.filter(ticket => {
            const matchesSearch = !q || (
                String(ticket.ticketID).includes(q) ||
                ticket.customer?.name?.toLowerCase().includes(q) ||
                ticket.customer?.email?.toLowerCase().includes(q) ||
                ticket.showtime?.movie?.title?.toLowerCase().includes(q) ||
                ticket.room?.roomName?.toLowerCase().includes(q) ||
                ticket.seat?.seatNumber?.toLowerCase().includes(q)
            );
            const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
            const matchesDate = !filterDate || (ticket.bookingDate && ticket.bookingDate.includes(filterDate)) || (ticket.showtime?.showtimeDate && ticket.showtime.showtimeDate.includes(filterDate));
            return matchesSearch && matchesStatus && matchesDate;
        });
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (activeTab === 'my') fetchMyTickets();
            else if (activeTab === 'all') fetchAllTickets();
        }
    };

    const handleBookSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!bookForm.showtimeId || !bookForm.seatIds) {
            setError('Vui lòng điền đầy đủ thông tin (Suất chiếu và ít nhất 1 ghế)');
            return;
        }
        bookTicket(bookForm);
    };

    // Load when tab changes
    useEffect(() => {
        if (activeTab === 'my') fetchMyTickets();
        else if (activeTab === 'all' && isAdmin()) fetchAllTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const stats = getStats();
    const filteredTickets = getFilteredTickets();
    const userIsLoggedIn = isLoggedIn();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                <Ticket className="w-10 h-10" />
                                Quản Lý Vé
                            </h1>
                            <p className="text-white/70 mt-2">{activeTab === 'my' ? 'Quản lý vé của bạn' : 'Quản lý toàn bộ vé hệ thống (Admin)'}</p>
                            {!userIsLoggedIn && <p className="text-yellow-400 text-sm mt-1">⚠️ Vui lòng đăng nhập để sử dụng chức năng</p>}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={activeTab === 'my' ? fetchMyTickets : fetchAllTickets} disabled={loading} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all disabled:opacity-50">
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Đang tải...' : 'Làm mới'}
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
                        <span>✅</span>
                        <span className="flex-1">{success}</span>
                        <button onClick={() => setSuccess('')} className="text-xl font-bold hover:text-green-300">×</button>
                    </div>
                )}

                {/* Tabs & Filters */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex border-b border-white/10 mb-4">
                        <button onClick={() => setActiveTab('my')} className={`px-4 py-2 font-medium transition-all ${activeTab === 'my' ? 'text-white border-b-2 border-blue-500' : 'text-white/60 hover:text-white'}`}>
                            <User className="w-4 h-4 inline mr-2" /> Vé của tôi ({myTickets.length})
                        </button>
                        {isAdmin() && (
                            <button onClick={() => setActiveTab('all')} className={`px-4 py-2 font-medium transition-all ${activeTab === 'all' ? 'text-white border-b-2 border-purple-500' : 'text-white/60 hover:text-white'}`}>
                                <Shield className="w-4 h-4 inline mr-2" /> Tất cả vé ({tickets.length})
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input type="text" placeholder="Tìm theo mã vé, tên, email, phim, phòng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={handleSearchKeyPress} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="all" className="bg-gray-800 text-blue-300">Tất cả trạng thái</option>
                            <option value="ACTIVE" className="bg-gray-800 text-green-300">Đang hoạt động</option>
                            <option value="CANCELLED" className="bg-gray-800 text-red-300">Đã hủy</option>
                            <option value="USED" className="bg-gray-800 text-blue-300">Đã sử dụng</option>
                            <option value="EXPIRED" className="bg-gray-800 text-orange-300">Đã hết hạn</option>
                        </select>
                        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button onClick={activeTab === 'my' ? fetchMyTickets : fetchAllTickets} disabled={loading} className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50">
                            <Search className="w-5 h-5" /> Tìm kiếm
                        </button>
                    </div>
                </div>

                {/* Tickets Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Ticket className="w-5 h-5" /> {activeTab === 'my' ? 'Vé của tôi' : 'Tất cả vé'} ({filteredTickets.length})</h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-white/70">Đang tải dữ liệu vé...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-12 text-center">
                            <Ticket className="w-16 h-16 text-white/30 mx-auto mb-4" />
                            <p className="text-white/70">{searchTerm || filterStatus !== 'all' || filterDate ? 'Không tìm thấy vé phù hợp' : activeTab === 'my' ? 'Bạn chưa có vé nào. Hãy đặt vé đầu tiên!' : 'Chưa có vé nào trong hệ thống'}</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 px-4 text-white/70 font-semibold">Mã vé</th>
                                            {activeTab === 'all' && <th className="text-left py-3 px-4 text-white/70 font-semibold">Khách hàng</th>}
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
                                        {filteredTickets.map(ticket => (
                                            <tr key={ticket.ticketID} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-4 px-4 text-white font-mono font-bold">#{ticket.ticketID}</td>
                                                {activeTab === 'all' && <td className="py-4 px-4"><div className="text-white font-medium">{ticket.customer?.name}</div><div className="text-white/50 text-sm">{ticket.customer?.email}</div></td>}
                                                <td className="py-4 px-4"><div className="text-white font-medium">{ticket.showtime?.movie?.title}</div><div className="text-white/50 text-sm">{ticket.showtime?.movie?.genre}</div></td>
                                                <td className="py-4 px-4"><div className="text-white font-medium">{ticket.room?.roomName}</div><div className="text-white/50 text-sm">Ghế: {ticket.seat?.seatNumber}</div></td>
                                                <td className="py-4 px-4"><div className="text-white font-medium">{ticket.showTime}</div><div className="text-white/50 text-sm">{formatDate(ticket.showtime?.showtimeDate)}</div></td>
                                                <td className="py-4 px-4"><div className="text-white font-bold">{formatCurrency(ticket.price)}</div></td>
                                                <td className="py-4 px-4"><div className="text-white">{formatDateTime(ticket.bookingDate)}</div></td>
                                                <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(ticket.status)}`}>{getStatusText(ticket.status)}</span></td>
                                                <td className="py-4 px-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => viewTicketDetails(ticket.ticketID)} className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg"><Eye className="w-4 h-4" /></button>
                                                        {ticket.status === 'ACTIVE' && activeTab === 'my' && (
                                                            <button onClick={() => { setSelectedTicket(ticket); setShowCancelModal(true); }} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg"><Ban className="w-4 h-4" /></button>
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
                            <h2 className="text-2xl font-bold text-white">Chi tiết vé #{selectedTicket.ticketID}</h2>
                            <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Thông tin tổng */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Ticket className="w-5 h-5" /> Thông tin vé</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-white/70">Mã vé:</span><span className="text-white font-bold">#{selectedTicket.ticketID}</span></div>
                                    <div className="flex justify-between"><span className="text-white/70">Giá:</span><span className="text-white font-bold">{formatCurrency(selectedTicket.price)}</span></div>
                                    <div className="flex justify-between"><span className="text-white/70">Trạng thái:</span><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusClass(selectedTicket.status)}`}>{getStatusText(selectedTicket.status)}</span></div>
                                    <div className="flex justify-between"><span className="text-white/70">Ngày đặt:</span><span className="text-white">{formatDateTime(selectedTicket.bookingDate)}</span></div>
                                </div>
                            </div>

                            {/* Khách hàng */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><User className="w-5 h-5" /> Thông tin khách hàng</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-white/70">Tên:</span><span className="text-white">{selectedTicket.customer?.name}</span></div>
                                    <div className="flex justify-between"><span className="text-white/70">Email:</span><span className="text-white">{selectedTicket.customer?.email}</span></div>
                                    <div className="flex justify-between"><span className="text-white/70">ID:</span><span className="text-white">#{selectedTicket.customer?.userID}</span></div>
                                </div>
                            </div>

                            {/* Suất & Phòng/Ghế */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Film className="w-5 h-5" /> Thông tin suất chiếu</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-white/70">Phim:</span><span className="text-white">{selectedTicket.showtime?.movie?.title}</span></div>
                                    <div className="flex justify-between"><span className="text-white/70">Suất chiếu:</span><span className="text-white">{selectedTicket.showTime}</span></div>
                                    <div className="flex justify-between"><span className="text-white/70">Ngày chiếu:</span><span className="text-white">{formatDate(selectedTicket.showtime?.showtimeDate)}</span></div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><MapPin className="w-5 h-5" /> Phòng & Ghế</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-white/70">Phòng:</span><span className="text-white">{selectedTicket.room?.roomName}</span></div>
                                    <div className="flex justify-between"><span className="text-white/70">Ghế:</span><span className="text-white font-bold">{selectedTicket.seat?.seatNumber}</span></div>
                                    <div className="flex justify-between"><span className="text-white/70">Loại ghế:</span><span className="text-white">{selectedTicket.seat?.seatType}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 mt-6 border-t border-white/10">
                            <button onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Đóng</button>
                            {selectedTicket.status === 'ACTIVE' && activeTab === 'my' && (
                                <button onClick={() => { setShowModal(false); setShowCancelModal(true); }} className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl flex items-center justify-center gap-2">
                                    <Ban className="w-5 h-5" /> Hủy vé
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && selectedTicket && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ban className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Xác nhận hủy vé</h3>
                        <p className="text-white/70 mb-6">Bạn có chắc chắn muốn hủy vé <strong className="text-white">#{selectedTicket.ticketID}</strong>? Hành động này không thể hoàn tác!</p>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowCancelModal(false); setSelectedTicket(null); }} disabled={modalLoading} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Hủy</button>
                            <button onClick={() => cancelTicket(selectedTicket.ticketID)} disabled={modalLoading} className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl">
                                {modalLoading ? 'Đang hủy...' : 'Xác nhận hủy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketManagement;