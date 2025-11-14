import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
    const [form, setForm] = useState({
        email: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (form.newPassword !== form.confirmPassword) {
            setMessage("❌ Mật khẩu mới và xác nhận mật khẩu không khớp!");
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post("http://localhost:8080/api/auth/reset-password", {
                email: form.email,
                otp_code: form.otp,
                new_password: form.newPassword,
            });

            if (res.data.success) {
                setMessage("✅ Đặt lại mật khẩu thành công! Chuyển về trang đăng nhập...");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setMessage(res.data.message || "❌ Đặt lại mật khẩu thất bại!");
            }
        } catch (err) {
            setMessage(err.response?.data?.message || "❌ Lỗi kết nối server!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
            >
                <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>

                {message && (
                    <p
                        className={`mb-4 text-center font-medium ${message.includes("✅") ? "text-black-600" : "text-red-500"
                            }`}
                    >
                        {message}
                    </p>
                )}

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
                />
                <input
                    type="text"
                    name="otp"
                    placeholder="OTP"
                    value={form.otp}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
                />
                <input
                    type="password"
                    name="newPassword"
                    placeholder="New Password"
                    value={form.newPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
                />
                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 mb-6 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                >
                    {loading ? "Đang xử lý..." : "Reset Password"}
                </button>
            </form>
        </div>
    );
};

export default ResetPassword;
