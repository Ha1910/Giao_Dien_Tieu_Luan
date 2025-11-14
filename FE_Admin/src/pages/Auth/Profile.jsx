import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const token = localStorage.getItem("token");
    const [activeTab, setActiveTab] = useState("profile");

    const [profile, setProfile] = useState({ full_name: "", email: "", phone: "", avatar_url: "" });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState("");

    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [stats, setStats] = useState(null);
    const [otps, setOtps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/user/profile", { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.success) {
                    setProfile(res.data.data.user);
                    setAvatarUrl(res.data.data.user.avatar_url || "");
                }
            } catch { }
        };
        const fetchStats = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/user/stats", { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.success) setStats(res.data.data);
            } catch { }
        };
        const fetchOtps = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/user/otps?limit=5", { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.success) setOtps(res.data.data.otps);
            } catch { }
        };
        fetchProfile();
        fetchStats();
        fetchOtps();
    }, [token]);

    const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = () => setAvatarUrl(reader.result);
        reader.readAsDataURL(file);
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setErrors([]);

        try {
            let uploadedUrl = avatarUrl;


            if (avatarFile) {
                const formData = new FormData();
                formData.append("avatar", avatarFile);
                const uploadRes = await axios.post(
                    "http://localhost:3000/api/user/upload-avatar",
                    formData,
                    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
                );
                uploadedUrl = uploadRes.data.url;
            }

            const res = await axios.put(
                "http://localhost:3000/api/user/profile",
                {
                    full_name: profile.full_name,
                    phone: profile.phone,
                    avatar_url: "anhThe.jpg"
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setMessage("✅ Cập nhật profile thành công!");
                setProfile(res.data.data.user);
                setAvatarUrl(res.data.data.user.avatar_url || "");
            } else {
                setMessage(res.data.message);
            }
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) setErrors(data.errors);
            setMessage(data?.message || "❌ Lỗi server!");
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setErrors([]);

        try {
            const res = await axios.post(
                "http://localhost:3000/api/user/change-password",
                { current_password: passwords.current, new_password: passwords.new, confirm_password: passwords.confirm },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setMessage("✅ Đổi mật khẩu thành công!");
                setPasswords({ current: "", new: "", confirm: "" });
            } else setMessage(res.data.message);
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) setErrors(data.errors);
            setMessage(data?.message || "❌ Lỗi server!");
        } finally {
            setLoading(false);
        }
    };

    const deleteAccount = async () => {
        const confirm = window.prompt("Nhập mật khẩu để xác nhận xóa tài khoản:");
        if (!confirm) return;
        try {
            const res = await axios.delete(
                "http://localhost:3000/api/user/account",
                { headers: { Authorization: `Bearer ${token}` }, data: { password: confirm } }
            );
            if (res.data.success) {
                alert("Tài khoản đã xóa thành công!");
                localStorage.removeItem("token");
                navigate("/login");
            }
        } catch (err) {
            alert(err.response?.data?.message || "❌ Lỗi xóa tài khoản");
        }
    };

    const tabs = [
        { id: "profile", label: "Thông tin cá nhân" },
        { id: "password", label: "Đổi mật khẩu" },
        { id: "stats", label: "Thống kê & OTP" },
        { id: "delete", label: "Xóa tài khoản" }
    ];

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-green-50 p-4 flex flex-col items-center">
            {/* Menu Tabs */}
            <div className="w-full max-w-lg mb-4 flex justify-around bg-white rounded-xl shadow">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`flex-1 py-2 font-medium ${activeTab === tab.id ? "bg-green-500 text-white rounded-xl" : "text-green-700"}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Nội dung tab */}
            <div className="w-full max-w-lg">
                {/* --- PROFILE --- */}
                {activeTab === "profile" && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        {message && <p className={`mb-4 text-center font-medium ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>{message}</p>}
                        {errors.length > 0 && <ul className="mb-4 text-red-500 list-disc list-inside">{errors.map((e, i) => <li key={i}>{e.field}: {e.message}</li>)}</ul>}

                        <form onSubmit={updateProfile}>
                            <label className="block mb-1">Họ và tên</label>
                            <input type="text" name="full_name" value={profile.full_name} onChange={handleProfileChange} className="w-full mb-2 p-2 border rounded" />

                            <label className="block mb-1">Email</label>
                            <input type="email" name="email" value={profile.email} readOnly className="w-full mb-2 p-2 border bg-gray-100 cursor-not-allowed" />

                            <label className="block mb-1">Số điện thoại</label>
                            <input type="text" name="phone" value={profile.phone} onChange={handleProfileChange} className="w-full mb-4 p-2 border rounded" />

                            <label className="block mb-1">Ảnh đại diện</label>
                            <div className="mb-4 flex items-center gap-4">
                                {avatarUrl && <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />}
                                <input type="file" accept="image/*" onChange={handleAvatarChange} />
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mb-2">{loading ? "Đang lưu..." : "Cập nhật"}</button>
                        </form>
                    </div>
                )}

                {/* --- PASSWORD --- */}
                {activeTab === "password" && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        {message && <p className={`mb-4 text-center font-medium ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>{message}</p>}
                        {errors.length > 0 && <ul className="mb-4 text-red-500 list-disc list-inside">{errors.map((e, i) => <li key={i}>{e.field}: {e.message}</li>)}</ul>}

                        <form onSubmit={changePassword}>
                            <input type="password" name="current" value={passwords.current} onChange={handlePasswordChange} placeholder="Mật khẩu hiện tại" className="w-full mb-2 p-2 border rounded" />
                            <input type="password" name="new" value={passwords.new} onChange={handlePasswordChange} placeholder="Mật khẩu mới" className="w-full mb-2 p-2 border rounded" />
                            <input type="password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} placeholder="Xác nhận mật khẩu mới" className="w-full mb-4 p-2 border rounded" />
                            <button type="submit" disabled={loading} className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mb-2">{loading ? "Đang lưu..." : "Đổi mật khẩu"}</button>
                        </form>
                    </div>
                )}

                {/* --- STATS --- */}
                {activeTab === "stats" && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        {stats && (
                            <ul className="mb-4">
                                <li>Đã xác thực: {stats.is_verified ? "✅" : "❌"}</li>
                                <li>Tổng OTP đã dùng: {stats.used_otps}</li>
                                <li>OTP hết hạn: {stats.expired_otps}</li>
                            </ul>
                        )}
                        {otps.length > 0 && (
                            <>
                                <h3 className="font-medium mb-2">Lịch sử OTP gần đây</h3>
                                <ul className="text-sm mb-2">
                                    {otps.map((o) => (
                                        <li key={o.id}>{o.otp_type} - {o.is_used ? "Đã dùng" : "Chưa dùng"} - Hết hạn: {o.is_expired ? "✅" : "❌"}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}

                {/* --- DELETE --- */}
                {activeTab === "delete" && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4 text-red-600">Xóa tài khoản</h2>
                        <button onClick={deleteAccount} className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600">Xóa tài khoản</button>
                    </div>
                )}
            </div>

            {/* Nút Đăng xuất */}
            <div className="w-full max-w-lg mt-6 flex justify-end">
                <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default Profile;
