// Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Sidebar from "../../components/layout/Sidebar";
import Dashboard from "../../components/Dashboard/Dashboard";
import MovieManagement from "../../components/Movie/MovieManagement";
import RoomManagement from "../../components/Room/RoomManagement";

const Home = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard />;
            case 'movies':
                return <MovieManagement />;
            case 'rooms':
                return <RoomManagement />;
            case 'showtimes':
                return (
                    <div className="p-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Quản Lý Lịch Chiếu</h1>
                        <p className="text-gray-600">Tính năng đang được phát triển...</p>
                    </div>
                );
            case 'users':
                return (
                    <div className="p-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Quản Lý Người Dùng</h1>
                        <p className="text-gray-600">Tính năng đang được phát triển...</p>
                    </div>
                );
            case 'reports':
                return (
                    <div className="p-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Báo Cáo & Thống Kê</h1>
                        <p className="text-gray-600">Tính năng đang được phát triển...</p>
                    </div>
                );
            case 'settings':
                return (
                    <div className="p-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Cài Đặt Hệ Thống</h1>
                        <p className="text-gray-600">Tính năng đang được phát triển...</p>
                    </div>
                );
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={isSidebarOpen}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-0">
                {/* Header */}
                <Header
                    user={user}
                    handleLogout={handleLogout}
                    onMenuToggle={toggleSidebar}
                    isSidebarOpen={isSidebarOpen}
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto">
                    {renderContent()}
                </main>

                {/* Footer */}
                <Footer />
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default Home;