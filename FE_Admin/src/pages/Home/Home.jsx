import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Sidebar from "../../components/layout/Sidebar";
import Dashboard from "../../components/Dashboard/Dashboard";
import MovieManagement from "../../components/Movie/MovieManagement";
import RoomManagement from "../../components/Room/RoomManagement";
import ShowtimeManagement from "../../components/Movie/ShowtimeManagement";
import UserManagement from "../../components/Author/UserManagement";
import ComboManagement from "../../components/Combo/ComboManagement";
import PromotionManagement from "../../components/Promotion/PromotionManagement";
import ReviewManagement from "../../components/Review/ReviewManagement";
import TicketManagement from "../../components/Ticket/TicketManagement";
import StatisticsManagement from "../../components/Statistics/StatisticsManagement";

const Home = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    const handleLogout = () => {
        // Xóa tất cả dữ liệu user khỏi localStorage
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");

        setUser(null);
        navigate("/login"); // Chuyển hướng về trang login
    };

    const toggleSidebar = () => setIsSidebarOpen((s) => !s);

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return <Dashboard />;
            case "movies":
                return <MovieManagement />;
            case "rooms":
                return <RoomManagement />;
            case "showtimes":
                return <ShowtimeManagement />;
            case "users":
                return <UserManagement />;
            case "combos":
                return <ComboManagement />;
            case "promotions":
                return <PromotionManagement />;
            case "reviews":
                return <ReviewManagement />;
            case "tickets":
                return <TicketManagement />;
            case "reports":
                return <StatisticsManagement></StatisticsManagement>
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} />

            <div className="flex-1 flex flex-col lg:ml-0">
                <Header user={user} handleLogout={handleLogout} onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
                <main className="flex-1 overflow-auto">{renderContent()}</main>
                <Footer />
            </div>

            {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
        </div>
    );
};

export default Home;