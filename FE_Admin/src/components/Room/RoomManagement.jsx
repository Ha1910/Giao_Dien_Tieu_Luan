import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, Save, X, Copy, Grid, Sofa, Monitor, Settings } from 'lucide-react';
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

// Component Seat riêng biệt với React.memo
const Seat = React.memo(({ seat, onClick, mode }) => {
    const getSeatWidth = (seat) => {
        if (seat.isCouple && seat.exists) return 'w-20';
        return 'w-10';
    };

    const getSeatStyle = (seat) => {
        if (!seat.exists || seat.partOfCouple) return 'bg-transparent border-transparent';

        const SEAT_TYPES = {
            STANDARD: { color: 'bg-gray-100 border-gray-300 text-gray-700', colorActive: 'bg-green-500 text-white' },
            COUPLE: { color: 'bg-pink-100 border-pink-300 text-pink-700', colorActive: 'bg-pink-500 text-white' },
            PREMIUM: { color: 'bg-yellow-100 border-yellow-400 text-yellow-800', colorActive: 'bg-yellow-500 text-white' },
            VIP: { color: 'bg-purple-100 border-purple-300 text-purple-700', colorActive: 'bg-purple-500 text-white' }
        };

        const typeStyle = SEAT_TYPES[seat.seatType] || SEAT_TYPES.STANDARD;

        if (seat.status === 'AVAILABLE') {
            return `${typeStyle.color} border-2 hover:scale-110 transition-transform cursor-pointer`;
        }
        return typeStyle.colorActive;
    };

    const getSeatDisplay = (seat) => {
        if (!seat.exists || seat.partOfCouple) return '';

        const SEAT_ICONS = {
            STANDARD: '💺',
            COUPLE: '❤️',
            PREMIUM: '⭐',
            VIP: '👑'
        };

        const icon = SEAT_ICONS[seat.seatType] || '';

        if (seat.isCouple) {
            return <span className="text-xs">{icon}</span>;
        }

        return <span className="text-xs">{seat.column}</span>;
    };

    const width = getSeatWidth(seat);
    const style = getSeatStyle(seat);
    const display = getSeatDisplay(seat);

    return (
        <button
            onClick={onClick}
            className={`${width} h-10 rounded flex items-center justify-center text-xs font-semibold transition-all ${style} shadow-md`}
            title={seat.exists ? `${seat.seatNumber}` : 'Click để thêm ghế'}
        >
            {display}
        </button>
    );
});

const SmartRoomManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modals
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showLayoutDesigner, setShowLayoutDesigner] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showPriceConfig, setShowPriceConfig] = useState(false);

    // Room form
    const [roomForm, setRoomForm] = useState({
        roomID: null,
        roomName: '',
        totalSeats: 0,
        layout: '',
        roomType: 'STANDARD'
    });

    // Layout Designer
    const [layoutConfig, setLayoutConfig] = useState({
        rows: 10,
        columns: 12,
        rowLabels: 'ABCDEFGHIJ',
        startColumn: 1
    });

    const [seatGrid, setSeatGrid] = useState([]);
    const [seatMode, setSeatMode] = useState('single');
    const [isLoadingGrid, setIsLoadingGrid] = useState(false);

    // Price Configuration
    const [roomPriceConfig, setRoomPriceConfig] = useState({});

    // Seat Types với màu sắc
    const SEAT_TYPES = useMemo(() => ({
        STANDARD: {
            name: 'Ghế Thường',
            color: 'bg-gray-100 border-gray-300 text-gray-700',
            colorActive: 'bg-green-500 text-white',
            icon: '💺'
        },
        COUPLE: {
            name: 'Ghế Đôi',
            color: 'bg-pink-100 border-pink-300 text-pink-700',
            colorActive: 'bg-pink-500 text-white',
            icon: '❤️',
            width: 2
        },
        PREMIUM: {
            name: 'Khu Trung Tâm',
            color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
            colorActive: 'bg-yellow-500 text-white',
            icon: '⭐'
        },
        VIP: {
            name: 'Ghế VIP',
            color: 'bg-purple-100 border-purple-300 text-purple-700',
            colorActive: 'bg-purple-500 text-white',
            icon: '👑'
        }
    }), []);

    // Giá mặc định
    const DEFAULT_PRICES = useMemo(() => ({
        STANDARD: 1.0,
        VIP: 1.5,
        COUPLE: 2.0,
        PREMIUM: 1.3
    }), []);

    // Templates
    const TEMPLATES = useMemo(() => ({
        standard: {
            name: 'Standard Cinema',
            rows: 14,
            columns: 16,
            aisles: [{ type: 'vertical', positions: [5, 11] }],
            premiumZone: { rows: [5, 6, 7, 8], columns: [6, 7, 8, 9, 10] }
        },
        luxury: {
            name: 'Luxury Cinema',
            rows: 10,
            columns: 12,
            aisles: [{ type: 'vertical', positions: [6] }],
            coupleRows: ['H', 'I', 'J'],
            premiumZone: { rows: [4, 5, 6], columns: [4, 5, 6, 7, 8] }
        },
        imax: {
            name: 'IMAX',
            rows: 15,
            columns: 20,
            aisles: [
                { type: 'vertical', positions: [6, 14] },
                { type: 'horizontal', positions: [7] }
            ],
            premiumZone: { rows: [6, 7, 8, 9, 10], columns: [7, 8, 9, 10, 11, 12, 13] }
        }
    }), []);

    // Fetch rooms
    useEffect(() => {
        fetchRooms();
        const savedPriceConfig = localStorage.getItem('roomPriceConfig');
        if (savedPriceConfig) {
            setRoomPriceConfig(JSON.parse(savedPriceConfig));
        }
    }, []);

    // Lưu price config vào localStorage khi thay đổi
    useEffect(() => {
        localStorage.setItem('roomPriceConfig', JSON.stringify(roomPriceConfig));
    }, [roomPriceConfig]);

    // Hàm lấy giá cho từng phòng
    const getRoomPriceConfig = useCallback((roomId) => {
        return roomPriceConfig[roomId] || DEFAULT_PRICES;
    }, [roomPriceConfig, DEFAULT_PRICES]);

    // Hàm cập nhật giá cho phòng
    const updateRoomPriceConfig = useCallback((roomId, seatType, value) => {
        setRoomPriceConfig(prev => ({
            ...prev,
            [roomId]: {
                ...getRoomPriceConfig(roomId),
                [seatType]: parseFloat(value) || 0
            }
        }));
    }, [getRoomPriceConfig]);

    // Reset giá về mặc định cho phòng
    const resetRoomPriceConfig = useCallback((roomId) => {
        setRoomPriceConfig(prev => ({
            ...prev,
            [roomId]: DEFAULT_PRICES
        }));
    }, [DEFAULT_PRICES]);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const response = await api.get('/rooms');
            setRooms(response.data);
        } catch (err) {
            setError('Lỗi khi tải danh sách phòng: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchSeats = async (roomId) => {
        setLoading(true);
        try {
            const response = await api.get(`/rooms/${roomId}/seats`);
            setSeats(response.data);
            setSelectedRoom(roomId);

            // Tạo grid đơn giản để hiển thị - FIXED
            const simpleGrid = createSimpleGridForDisplay(response.data);
            setSeatGrid(simpleGrid);
        } catch (err) {
            setError('Lỗi khi tải danh sách ghế: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Hàm tạo grid đơn giản để hiển thị BÊN NGOÀI - FIXED
    const createSimpleGridForDisplay = (seatsData) => {
        const rows = {};

        // Nhóm ghế theo hàng
        seatsData.forEach(seat => {
            const rowChar = seat.seatNumber.charAt(0);
            const col = parseInt(seat.seatNumber.slice(1)) || 1;

            if (!rows[rowChar]) {
                rows[rowChar] = {};
            }
            rows[rowChar][col] = seat;
        });

        return rows;
    };

    // Initialize seat grid nhanh - CHO LAYOUT DESIGNER
    const initializeSeatGridFast = useCallback((template = null) => {
        const config = template || layoutConfig;
        const grid = [];
        const rowLabels = config.rowLabels || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const currentPriceConfig = selectedRoom ? getRoomPriceConfig(selectedRoom) : DEFAULT_PRICES;

        for (let i = 0; i < config.rows; i++) {
            const row = [];
            const rowLabel = rowLabels[i] || `R${i + 1}`;

            for (let j = 1; j <= config.columns; j++) {
                let isAisle = false;
                let isPremium = false;
                let seatType = 'STANDARD';

                if (template) {
                    // Check aisles
                    if (template.aisles) {
                        isAisle = template.aisles.some(aisle => {
                            if (aisle.type === 'vertical' && aisle.positions.includes(j)) return true;
                            if (aisle.type === 'horizontal' && aisle.positions.includes(i)) return true;
                            return false;
                        });
                    }

                    // Check premium zone
                    if (template.premiumZone && !isAisle) {
                        isPremium = template.premiumZone.rows.includes(i) &&
                            template.premiumZone.columns.includes(j);
                        if (isPremium) seatType = 'PREMIUM';
                    }

                    // Check couple rows
                    if (template.coupleRows && template.coupleRows.includes(rowLabel) && !isAisle) {
                        seatType = 'COUPLE';
                    }
                }

                row.push({
                    row: rowLabel,
                    column: j,
                    seatNumber: `${rowLabel}${j}`,
                    exists: !isAisle,
                    status: 'AVAILABLE',
                    seatType: seatType,
                    priceMultiplier: currentPriceConfig[seatType] || 1.0,
                    isCouple: seatType === 'COUPLE',
                    isPremium: isPremium
                });
            }
            grid.push(row);
        }

        setSeatGrid(grid);
    }, [layoutConfig, selectedRoom, getRoomPriceConfig, DEFAULT_PRICES]);

    // Hàm load seats nhanh - CHO LAYOUT DESIGNER
    const loadExistingSeatsFast = useCallback(() => {
        if (seats.length === 0) {
            initializeSeatGridFast();
            return;
        }

        const rowMap = new Map();
        let maxColumn = 0;

        // Chỉ 1 vòng lặp duy nhất - SIÊU NHANH
        seats.forEach(seat => {
            const row = seat.seatNumber.charAt(0);
            const col = parseInt(seat.seatNumber.slice(1)) || 1;

            if (!rowMap.has(row)) {
                rowMap.set(row, new Map());
            }
            rowMap.get(row).set(col, seat);

            if (col > maxColumn) maxColumn = col;
        });

        const rows = Array.from(rowMap.keys()).sort();
        const currentPriceConfig = getRoomPriceConfig(selectedRoom);
        const newGrid = [];

        rows.forEach(rowChar => {
            const rowData = [];
            const rowSeats = rowMap.get(rowChar);

            for (let col = 1; col <= maxColumn; col++) {
                const seat = rowSeats?.get(col);
                if (seat) {
                    rowData.push({
                        row: rowChar,
                        column: col,
                        seatNumber: `${rowChar}${col}`,
                        exists: true,
                        status: seat.status || 'AVAILABLE',
                        seatType: seat.seatType || 'STANDARD',
                        priceMultiplier: seat.priceMultiplier || currentPriceConfig[seat.seatType] || 1.0,
                        isCouple: seat.seatType === 'COUPLE',
                        isPremium: seat.seatType === 'PREMIUM'
                    });
                } else {
                    // Tạo seat trống
                    rowData.push({
                        row: rowChar,
                        column: col,
                        seatNumber: `${rowChar}${col}`,
                        exists: false,
                        status: 'AVAILABLE',
                        seatType: 'STANDARD',
                        priceMultiplier: 1.0,
                        isCouple: false,
                        isPremium: false
                    });
                }
            }
            newGrid.push(rowData);
        });

        setSeatGrid(newGrid);
    }, [seats, selectedRoom, getRoomPriceConfig, initializeSeatGridFast]);

    // Toggle seat or change type - TỐI ƯU
    const handleSeatClick = useCallback((rowIndex, colIndex) => {
        setSeatGrid(currentGrid => {
            const newGrid = currentGrid.map(row => [...row]);
            const seat = newGrid[rowIndex][colIndex];
            const currentPriceConfig = getRoomPriceConfig(selectedRoom);

            if (seatMode === 'aisle') {
                seat.exists = !seat.exists;
                if (!seat.exists) {
                    seat.seatType = 'STANDARD';
                    seat.isCouple = false;
                }
            } else if (seatMode === 'couple') {
                if (seat.exists && colIndex < currentGrid[rowIndex].length - 1) {
                    seat.seatType = 'COUPLE';
                    seat.isCouple = true;
                    seat.priceMultiplier = currentPriceConfig.COUPLE || 2.0;
                    const nextSeat = newGrid[rowIndex][colIndex + 1];
                    if (nextSeat && nextSeat.exists) {
                        nextSeat.exists = false;
                        nextSeat.partOfCouple = true;
                    }
                }
            } else if (seatMode === 'premium') {
                if (seat.exists) {
                    seat.seatType = 'PREMIUM';
                    seat.isPremium = true;
                    seat.priceMultiplier = currentPriceConfig.PREMIUM || 1.3;
                }
            } else if (seatMode === 'single') {
                if (seat.exists) {
                    const types = ['STANDARD', 'VIP'];
                    const currentIndex = types.indexOf(seat.seatType);
                    const nextType = types[(currentIndex + 1) % types.length];
                    seat.seatType = nextType;
                    seat.priceMultiplier = currentPriceConfig[nextType] || 1.0;
                } else {
                    seat.exists = true;
                    seat.seatType = 'STANDARD';
                    seat.priceMultiplier = currentPriceConfig.STANDARD || 1.0;
                }
            }

            return newGrid;
        });
    }, [seatMode, selectedRoom, getRoomPriceConfig]);

    // Apply template
    const applyTemplate = useCallback((templateKey) => {
        const template = TEMPLATES[templateKey];
        setLayoutConfig({
            rows: template.rows,
            columns: template.columns,
            rowLabels: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.substring(0, template.rows)
        });

        // Dùng setTimeout để không block UI
        setTimeout(() => {
            initializeSeatGridFast(template);
        }, 0);

        setShowTemplateModal(false);
    }, [TEMPLATES, initializeSeatGridFast]);

    // Save layout to database
    const saveLayoutToDatabase = async () => {
        if (!selectedRoom) {
            setError('Vui lòng chọn phòng trước!');
            return;
        }

        setLoading(true);
        try {
            const room = rooms.find(r => r.roomID === selectedRoom);
            const layoutData = {
                roomID: selectedRoom,
                roomName: room.roomName,
                totalRows: seatGrid.length,
                totalColumns: seatGrid[0]?.length || 0,
                rowLabels: seatGrid.map(row => row[0]?.row).join(''),
                roomType: room.roomType || 'STANDARD',
                seats: []
            };

            seatGrid.forEach(row => {
                row.forEach(seat => {
                    if (seat.exists && !seat.partOfCouple) {
                        layoutData.seats.push({
                            seatNumber: seat.seatNumber,
                            rowLabel: seat.row,
                            columnNumber: seat.column,
                            seatType: seat.seatType || 'STANDARD',
                            status: seat.status || 'AVAILABLE',
                            priceMultiplier: seat.priceMultiplier || 1.0,
                            exists: true
                        });
                    }
                });
            });

            const response = await api.post(`/rooms/${selectedRoom}/layout`, layoutData);

            if (response.status === 200) {
                setSuccess('Lưu cấu hình ghế thành công!');
                setShowLayoutDesigner(false);
                fetchSeats(selectedRoom);
                fetchRooms();
            }
        } catch (err) {
            setError('Lỗi khi lưu cấu hình: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Room CRUD
    const saveRoom = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let response;
            if (roomForm.roomID) {
                response = await api.put(`/rooms/${roomForm.roomID}`, roomForm);
            } else {
                response = await api.post('/rooms', roomForm);
            }

            if (response.status === 200) {
                setSuccess(roomForm.roomID ? 'Cập nhật phòng thành công!' : 'Thêm phòng thành công!');
                setShowRoomModal(false);
                resetRoomForm();
                fetchRooms();
            }
        } catch (err) {
            setError('Lỗi khi lưu phòng: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const deleteRoom = async (roomId) => {
        if (!window.confirm('Xóa phòng này? Tất cả ghế sẽ bị xóa!')) return;

        setLoading(true);
        try {
            await api.delete(`/rooms/${roomId}`);
            setSuccess('Xóa phòng thành công!');
            fetchRooms();
            if (selectedRoom === roomId) {
                setSelectedRoom(null);
                setSeats([]);
            }
        } catch (err) {
            setError('Lỗi khi xóa phòng: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const editRoom = (room) => {
        setRoomForm(room);
        setShowRoomModal(true);
    };

    const resetRoomForm = () => {
        setRoomForm({
            roomID: null,
            roomName: '',
            totalSeats: 0,
            layout: '',
            roomType: 'STANDARD'
        });
    };

    // OPEN LAYOUT DESIGNER - ĐÃ TỐI ƯU
    const openLayoutDesigner = () => {
        if (!selectedRoom) {
            setError('Vui lòng chọn phòng trước!');
            return;
        }

        setShowLayoutDesigner(true);
        setIsLoadingGrid(true);

        // Dùng setTimeout để không block UI
        setTimeout(() => {
            if (seats.length > 0) {
                loadExistingSeatsFast();
            } else {
                initializeSeatGridFast();
            }
            setIsLoadingGrid(false);
        }, 10);
    };

    // Get seat styling cho display BÊN NGOÀI - FIXED
    const getSeatStyleDisplay = useCallback((seat) => {
        if (!seat) return 'bg-transparent border-transparent';

        const typeStyle = SEAT_TYPES[seat.seatType] || SEAT_TYPES.STANDARD;

        if (seat.status === 'AVAILABLE') {
            return `${typeStyle.color} border-2`;
        }
        return typeStyle.colorActive;
    }, [SEAT_TYPES]);

    const getSeatDisplaySimple = useCallback((seat) => {
        if (!seat) return '';

        const icon = SEAT_TYPES[seat.seatType]?.icon || '';

        if (seat.seatType === 'COUPLE') {
            return <span className="text-xs">{icon}</span>;
        }

        return <span className="text-xs">{seat.seatNumber.slice(1)}</span>;
    }, [SEAT_TYPES]);

    const getSeatWidthDisplay = useCallback((seat) => {
        if (!seat) return 'w-10';
        if (seat.seatType === 'COUPLE') return 'w-20';
        return 'w-10';
    }, []);

    // Áp dụng giá mới cho toàn bộ layout hiện tại
    const applyNewPricesToLayout = useCallback(() => {
        if (seatGrid.length > 0) {
            setSeatGrid(currentGrid => {
                const newGrid = currentGrid.map(row => [...row]);
                const currentPriceConfig = getRoomPriceConfig(selectedRoom);

                newGrid.forEach(row => {
                    row.forEach(seat => {
                        if (seat.exists) {
                            seat.priceMultiplier = currentPriceConfig[seat.seatType] || 1.0;
                        }
                    });
                });

                return newGrid;
            });
        }
    }, [selectedRoom, getRoomPriceConfig]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-6 mb-6 border border-white/20">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-white">🎬 Quản Lý Phòng & Ghế</h1>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPriceConfig(true)}
                                disabled={!selectedRoom}
                                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Settings className="w-5 h-5" />
                                Cấu Hình Giá Phòng
                            </button>
                            <button
                                onClick={() => {
                                    resetRoomForm();
                                    setShowRoomModal(true);
                                }}
                                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 shadow-lg"
                            >
                                <Plus className="w-5 h-5" />
                                Thêm Phòng
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500 text-white rounded-lg flex justify-between backdrop-blur-md">
                        {error}
                        <button onClick={() => setError('')} className="font-bold">×</button>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-500/20 border border-green-500 text-white rounded-lg flex justify-between backdrop-blur-md">
                        {success}
                        <button onClick={() => setSuccess('')} className="font-bold">×</button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Rooms List */}
                    <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-6 border border-white/20">
                        <h2 className="text-xl font-bold mb-4 text-white">Danh Sách Phòng</h2>

                        {rooms.length === 0 ? (
                            <div className="text-center text-white/60 py-8">Chưa có phòng nào</div>
                        ) : (
                            <div className="space-y-3">
                                {rooms.map(room => (
                                    <div
                                        key={room.roomID}
                                        className={`p-4 rounded-lg cursor-pointer transition-all ${selectedRoom === room.roomID
                                            ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-white/40'
                                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                            }`}
                                        onClick={() => fetchSeats(room.roomID)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="text-white">
                                                <h3 className="font-semibold text-lg">{room.roomName}</h3>
                                                <p className="text-sm text-white/70 flex items-center gap-1">
                                                    <Sofa className="w-4 h-4" />
                                                    {room.totalSeats} ghế
                                                </p>
                                                {roomPriceConfig[room.roomID] && (
                                                    <p className="text-xs text-yellow-300 mt-1 flex items-center gap-1">
                                                        <span>⭐</span>
                                                        Đã cấu hình giá riêng
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        editRoom(room);
                                                    }}
                                                    className="p-2 text-blue-300 hover:bg-blue-500/20 rounded"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteRoom(room.roomID);
                                                    }}
                                                    className="p-2 text-red-300 hover:bg-red-500/20 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Seat Layout Display - FIXED FOR EXTERNAL VIEW */}
                    <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-6 border border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {selectedRoom ? `Sơ Đồ Ghế - ${rooms.find(r => r.roomID === selectedRoom)?.roomName}` : 'Sơ Đồ Ghế'}
                            </h2>

                            {selectedRoom && (
                                <button
                                    onClick={openLayoutDesigner}
                                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-600 shadow-lg"
                                >
                                    <Grid className="w-5 h-5" />
                                    Thiết Kế Layout
                                </button>
                            )}
                        </div>

                        {!selectedRoom ? (
                            <div className="text-center text-white/60 py-16">
                                <Monitor className="w-16 h-16 mx-auto mb-4" />
                                <p>Chọn một phòng để xem sơ đồ ghế</p>
                            </div>
                        ) : seats.length === 0 ? (
                            <div className="text-center text-white/60 py-16">
                                <Sofa className="w-16 h-16 mx-auto mb-4" />
                                <p className="mb-4">Phòng này chưa có ghế</p>
                                <button
                                    onClick={openLayoutDesigner}
                                    className="text-blue-300 hover:underline"
                                >
                                    Nhấn vào đây để thiết kế layout
                                </button>
                            </div>
                        ) : (
                            <div className="bg-black/30 p-6 rounded-lg border border-white/10">
                                {/* Screen */}
                                <div className="text-center mb-8">
                                    <div className="bg-gradient-to-b from-gray-700 to-gray-900 text-white py-3 px-8 rounded-lg inline-block shadow-2xl border-2 border-white/20">
                                        <Monitor className="inline w-5 h-5 mr-2" />
                                        MÀN HÌNH
                                    </div>
                                </div>

                                {/* Seats - FIXED EXTERNAL DISPLAY */}
                                <div className="flex flex-col items-center space-y-2 overflow-x-auto">
                                    {Object.keys(seatGrid).sort().map(rowKey => (
                                        <div key={rowKey} className="flex items-center gap-3">
                                            <div className="w-8 text-center font-bold text-white text-lg">{rowKey}</div>
                                            <div className="flex gap-1">
                                                {Object.keys(seatGrid[rowKey])
                                                    .map(Number)
                                                    .sort((a, b) => a - b)
                                                    .map(colKey => {
                                                        const seat = seatGrid[rowKey][colKey];
                                                        const width = getSeatWidthDisplay(seat);
                                                        const currentPriceConfig = getRoomPriceConfig(selectedRoom);
                                                        const price = currentPriceConfig[seat.seatType] || 1.0;

                                                        return (
                                                            <div
                                                                key={colKey}
                                                                className={`${width} h-10 rounded flex items-center justify-center text-xs font-semibold ${getSeatStyleDisplay(seat)}`}
                                                                title={seat ? `${seat.seatNumber} - ${SEAT_TYPES[seat.seatType]?.name} (×${price})` : ''}
                                                            >
                                                                {getSeatDisplaySimple(seat)}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div className="mt-8 flex justify-center gap-4 flex-wrap">
                                    {Object.entries(SEAT_TYPES).map(([key, type]) => {
                                        const currentPriceConfig = getRoomPriceConfig(selectedRoom);
                                        const price = currentPriceConfig[key] || 1.0;

                                        return (
                                            <div key={key} className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                                                <div className={`w-6 h-6 rounded ${type.color} flex items-center justify-center text-sm`}>
                                                    {type.icon}
                                                </div>
                                                <span className="text-sm text-white">{type.name}</span>
                                                <span className="text-xs text-yellow-300 font-semibold">×{price}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Stats */}
                                <div className="mt-6 grid grid-cols-4 gap-4">
                                    <div className="bg-green-500/20 p-3 rounded-lg text-center border border-green-500/30">
                                        <div className="text-2xl font-bold text-green-300">
                                            {seats.filter(s => s.status === 'AVAILABLE').length}
                                        </div>
                                        <div className="text-sm text-green-200">Trống</div>
                                    </div>
                                    <div className="bg-pink-500/20 p-3 rounded-lg text-center border border-pink-500/30">
                                        <div className="text-2xl font-bold text-pink-300">
                                            {seats.filter(s => s.seatType === 'COUPLE').length}
                                        </div>
                                        <div className="text-sm text-pink-200">Ghế Đôi</div>
                                    </div>
                                    <div className="bg-yellow-500/20 p-3 rounded-lg text-center border border-yellow-500/30">
                                        <div className="text-2xl font-bold text-yellow-300">
                                            {seats.filter(s => s.seatType === 'PREMIUM').length}
                                        </div>
                                        <div className="text-sm text-yellow-200">Premium</div>
                                    </div>
                                    <div className="bg-purple-500/20 p-3 rounded-lg text-center border border-purple-500/30">
                                        <div className="text-2xl font-bold text-purple-300">
                                            {seats.filter(s => s.seatType === 'VIP').length}
                                        </div>
                                        <div className="text-sm text-purple-200">VIP</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Các modal khác giữ nguyên... */}
                {/* Room Modal */}
                {showRoomModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-white/20">
                            <h2 className="text-2xl font-bold mb-4 text-white">
                                {roomForm.roomID ? 'Chỉnh Sửa Phòng' : 'Thêm Phòng Mới'}
                            </h2>
                            <form onSubmit={saveRoom}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Tên Phòng *
                                        </label>
                                        <input
                                            type="text"
                                            value={roomForm.roomName}
                                            onChange={(e) => setRoomForm({ ...roomForm, roomName: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Loại Phòng
                                        </label>
                                        <select
                                            value={roomForm.roomType}
                                            onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="STANDARD">Standard</option>
                                            <option value="VIP">VIP</option>
                                            <option value="IMAX">IMAX</option>
                                            <option value="4DX">4DX</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Ghi Chú
                                        </label>
                                        <textarea
                                            value={roomForm.layout}
                                            onChange={(e) => setRoomForm({ ...roomForm, layout: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowRoomModal(false);
                                            resetRoomForm();
                                        }}
                                        className="flex-1 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600"
                                    >
                                        {roomForm.roomID ? 'Cập Nhật' : 'Thêm Mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Layout Designer Modal - GIỮ NGUYÊN */}
                {showLayoutDesigner && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-gray-900 rounded-lg w-full max-w-7xl my-8 border border-white/20">
                            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex justify-between items-center rounded-t-lg">
                                <h2 className="text-2xl font-bold">🎨 Thiết Kế Layout Ghế</h2>
                                <button onClick={() => setShowLayoutDesigner(false)} className="p-2 hover:bg-white/20 rounded">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 max-h-[80vh] overflow-y-auto">
                                {isLoadingGrid ? (
                                    <div className="flex justify-center items-center py-20">
                                        <div className="text-white text-lg">Đang tải layout...</div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Controls */}
                                        <div className="mb-6 space-y-4">
                                            {/* Mode Selection */}
                                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                                <h3 className="text-white font-semibold mb-3">Chế Độ Thiết Kế:</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                    <button
                                                        onClick={() => setSeatMode('single')}
                                                        className={`px-4 py-3 rounded-lg transition-all ${seatMode === 'single'
                                                            ? 'bg-green-500 text-white shadow-lg'
                                                            : 'bg-white/10 text-white hover:bg-white/20'
                                                            }`}
                                                    >
                                                        💺 Ghế Đơn
                                                    </button>
                                                    <button
                                                        onClick={() => setSeatMode('couple')}
                                                        className={`px-4 py-3 rounded-lg transition-all ${seatMode === 'couple'
                                                            ? 'bg-pink-500 text-white shadow-lg'
                                                            : 'bg-white/10 text-white hover:bg-white/20'
                                                            }`}
                                                    >
                                                        ❤️ Ghế Đôi
                                                    </button>
                                                    <button
                                                        onClick={() => setSeatMode('premium')}
                                                        className={`px-4 py-3 rounded-lg transition-all ${seatMode === 'premium'
                                                            ? 'bg-yellow-500 text-white shadow-lg'
                                                            : 'bg-white/10 text-white hover:bg-white/20'
                                                            }`}
                                                    >
                                                        ⭐ Khu Trung Tâm
                                                    </button>
                                                    <button
                                                        onClick={() => setSeatMode('aisle')}
                                                        className={`px-4 py-3 rounded-lg transition-all ${seatMode === 'aisle'
                                                            ? 'bg-gray-500 text-white shadow-lg'
                                                            : 'bg-white/10 text-white hover:bg-white/20'
                                                            }`}
                                                    >
                                                        🚪 Lối Đi
                                                    </button>
                                                    <button
                                                        onClick={() => setShowTemplateModal(true)}
                                                        className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600"
                                                    >
                                                        <Copy className="inline w-4 h-4 mr-1" />
                                                        Template
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Grid Config */}
                                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                                <h3 className="text-white font-semibold mb-3">Cấu Hình Lưới:</h3>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2 text-white">Số Hàng</label>
                                                        <input
                                                            type="number"
                                                            value={layoutConfig.rows}
                                                            onChange={(e) => setLayoutConfig({ ...layoutConfig, rows: parseInt(e.target.value) })}
                                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                                            min="1"
                                                            max="26"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2 text-white">Số Cột</label>
                                                        <input
                                                            type="number"
                                                            value={layoutConfig.columns}
                                                            onChange={(e) => setLayoutConfig({ ...layoutConfig, columns: parseInt(e.target.value) })}
                                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                                            min="1"
                                                            max="30"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2 text-white">Nhãn Hàng</label>
                                                        <input
                                                            type="text"
                                                            value={layoutConfig.rowLabels}
                                                            onChange={(e) => setLayoutConfig({ ...layoutConfig, rowLabels: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                                            placeholder="ABCDEFGH..."
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => initializeSeatGridFast()}
                                                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                >
                                                    Tạo Lưới Ghế
                                                </button>
                                            </div>

                                            {/* Price Info */}
                                            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                                                <h3 className="text-green-300 font-semibold mb-2">💰 Thông Tin Giá:</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {Object.entries(SEAT_TYPES).map(([key, type]) => {
                                                        const currentPriceConfig = getRoomPriceConfig(selectedRoom);
                                                        const price = currentPriceConfig[key] || 1.0;
                                                        return (
                                                            <div key={key} className="flex items-center gap-2 text-sm">
                                                                <div className={`w-4 h-4 rounded ${type.color} flex items-center justify-center text-xs`}>
                                                                    {type.icon}
                                                                </div>
                                                                <span className="text-green-200">{type.name}</span>
                                                                <span className="text-yellow-300 font-semibold">×{price}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seat Grid */}
                                        {seatGrid.length > 0 && (
                                            <div className="bg-black/30 p-6 rounded-lg border border-white/10">
                                                <div className="text-center mb-6">
                                                    <div className="bg-gradient-to-b from-gray-700 to-gray-900 text-white py-3 px-8 rounded-lg inline-block shadow-xl border-2 border-white/20">
                                                        <Monitor className="inline w-5 h-5 mr-2" />
                                                        MÀN HÌNH
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center space-y-2 overflow-x-auto pb-4">
                                                    {seatGrid.map((row, rowIndex) => (
                                                        <div key={rowIndex} className="flex items-center gap-2">
                                                            <div className="w-8 text-center font-bold text-white text-lg">{row[0]?.row}</div>
                                                            <div className="flex gap-1">
                                                                {row.map((seat, colIndex) => (
                                                                    <Seat
                                                                        key={colIndex}
                                                                        seat={seat}
                                                                        mode={seatMode}
                                                                        onClick={() => handleSeatClick(rowIndex, colIndex)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Legend */}
                                                <div className="mt-8 flex justify-center gap-4 flex-wrap">
                                                    {Object.entries(SEAT_TYPES).map(([key, type]) => {
                                                        const currentPriceConfig = getRoomPriceConfig(selectedRoom);
                                                        const price = currentPriceConfig[key] || 1.0;

                                                        return (
                                                            <div key={key} className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg border border-white/20">
                                                                <div className={`w-6 h-6 rounded ${type.color} flex items-center justify-center text-sm border-2`}>
                                                                    {type.icon}
                                                                </div>
                                                                <span className="text-sm text-white">{type.name}</span>
                                                                <span className="text-xs text-yellow-300 font-semibold">×{price}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Stats */}
                                                <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                                                    <div className="bg-green-500/20 p-3 rounded-lg text-center border border-green-500/30">
                                                        <div className="text-2xl font-bold text-green-300">
                                                            {seatGrid.flat().filter(s => s.exists && !s.partOfCouple).length}
                                                        </div>
                                                        <div className="text-sm text-green-200">Tổng ghế</div>
                                                    </div>
                                                    <div className="bg-gray-500/20 p-3 rounded-lg text-center border border-gray-500/30">
                                                        <div className="text-2xl font-bold text-gray-300">
                                                            {seatGrid.flat().filter(s => s.seatType === 'STANDARD' && s.exists).length}
                                                        </div>
                                                        <div className="text-sm text-gray-200">Thường</div>
                                                    </div>
                                                    <div className="bg-pink-500/20 p-3 rounded-lg text-center border border-pink-500/30">
                                                        <div className="text-2xl font-bold text-pink-300">
                                                            {seatGrid.flat().filter(s => s.seatType === 'COUPLE' && s.exists).length}
                                                        </div>
                                                        <div className="text-sm text-pink-200">Ghế Đôi</div>
                                                    </div>
                                                    <div className="bg-yellow-500/20 p-3 rounded-lg text-center border border-yellow-500/30">
                                                        <div className="text-2xl font-bold text-yellow-300">
                                                            {seatGrid.flat().filter(s => s.seatType === 'PREMIUM' && s.exists).length}
                                                        </div>
                                                        <div className="text-sm text-yellow-200">Premium</div>
                                                    </div>
                                                    <div className="bg-purple-500/20 p-3 rounded-lg text-center border border-purple-500/30">
                                                        <div className="text-2xl font-bold text-purple-300">
                                                            {seatGrid.flat().filter(s => s.seatType === 'VIP' && s.exists).length}
                                                        </div>
                                                        <div className="text-sm text-purple-200">VIP</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Save Button */}
                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={() => setShowLayoutDesigner(false)}
                                                className="flex-1 px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 text-white"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                onClick={saveLayoutToDatabase}
                                                disabled={loading}
                                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                                            >
                                                <Save className="w-5 h-5" />
                                                {loading ? 'Đang lưu...' : 'Lưu Layout'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Price Configuration Modal */}
                {showPriceConfig && selectedRoom && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-white/20">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    💰 Cấu Hình Giá - {rooms.find(r => r.roomID === selectedRoom)?.roomName}
                                </h2>
                                <button onClick={() => setShowPriceConfig(false)} className="p-2 hover:bg-white/10 rounded">
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(SEAT_TYPES).map(([key, type]) => {
                                    const currentPrice = getRoomPriceConfig(selectedRoom)[key] || DEFAULT_PRICES[key];
                                    return (
                                        <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center text-lg border-2`}>
                                                    {type.icon}
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold">{type.name}</div>
                                                    <div className="text-sm text-white/60">Hệ số giá</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white">×</span>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0.1"
                                                    max="10"
                                                    value={currentPrice}
                                                    onChange={(e) => updateRoomPriceConfig(selectedRoom, key, e.target.value)}
                                                    className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center focus:ring-2 focus:ring-orange-500"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                                <p className="text-sm text-blue-200">
                                    <strong>💡 Giải thích:</strong> Hệ số giá sẽ nhân với giá vé cơ bản.
                                    Ví dụ: Ghế VIP ×1.5 = Giá vé × 1.5
                                </p>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => resetRoomPriceConfig(selectedRoom)}
                                    className="flex-1 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"
                                >
                                    Đặt Lại Mặc Định
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPriceConfig(false);
                                        applyNewPricesToLayout();
                                        setSuccess('Cập nhật giá thành công!');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600"
                                >
                                    Lưu & Áp Dụng
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Template Modal */}
                {showTemplateModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl border border-white/20">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">🎬 Chọn Template</h2>
                                <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-white/10 rounded">
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries(TEMPLATES).map(([key, template]) => (
                                    <button
                                        key={key}
                                        onClick={() => applyTemplate(key)}
                                        className="p-6 bg-white/5 border-2 border-white/10 rounded-lg hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left group"
                                    >
                                        <h3 className="text-xl font-bold mb-3 text-white group-hover:text-purple-300">{template.name}</h3>
                                        <div className="text-sm text-white/70 space-y-2">
                                            <p className="flex items-center gap-2">
                                                <span className="text-purple-400">📐</span>
                                                {template.rows} hàng × {template.columns} cột
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="text-green-400">💺</span>
                                                ~{template.rows * template.columns - (template.aisles?.[0]?.positions?.length || 0)} ghế
                                            </p>
                                            {template.coupleRows && (
                                                <p className="flex items-center gap-2">
                                                    <span className="text-pink-400">❤️</span>
                                                    Có ghế đôi: {template.coupleRows.join(', ')}
                                                </p>
                                            )}
                                            {template.premiumZone && (
                                                <p className="flex items-center gap-2">
                                                    <span className="text-yellow-400">⭐</span>
                                                    Có khu trung tâm
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-4 flex justify-center bg-black/30 p-3 rounded">
                                            <div className="grid gap-0.5" style={{
                                                gridTemplateColumns: `repeat(${Math.min(template.columns, 16)}, 1fr)`
                                            }}>
                                                {Array.from({ length: Math.min(template.rows, 10) }).map((_, i) =>
                                                    Array.from({ length: Math.min(template.columns, 16) }).map((_, j) => {
                                                        let isAisle = false;
                                                        let isPremium = false;
                                                        let isCouple = false;

                                                        if (template.aisles) {
                                                            isAisle = template.aisles.some(aisle => {
                                                                if (aisle.type === 'vertical' && aisle.positions?.includes(j + 1)) return true;
                                                                if (aisle.type === 'horizontal' && aisle.positions?.includes(i)) return true;
                                                                return false;
                                                            });
                                                        }

                                                        if (template.premiumZone && !isAisle) {
                                                            isPremium = template.premiumZone.rows.includes(i) &&
                                                                template.premiumZone.columns.includes(j + 1);
                                                        }

                                                        const rowLabel = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i];
                                                        if (template.coupleRows?.includes(rowLabel) && !isAisle) {
                                                            isCouple = true;
                                                        }

                                                        return (
                                                            <div
                                                                key={`${i}-${j}`}
                                                                className={`w-2 h-2 rounded-sm ${isAisle ? 'bg-transparent' :
                                                                    isCouple ? 'bg-pink-500' :
                                                                        isPremium ? 'bg-yellow-500' : 'bg-green-500'
                                                                    }`}
                                                            />
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                                <p className="text-sm text-yellow-200">
                                    <strong>💡 Lưu ý:</strong> Chọn template sẽ tạo layout mới. Bạn có thể chỉnh sửa sau khi chọn.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartRoomManagement;