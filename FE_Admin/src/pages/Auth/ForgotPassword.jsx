import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("http://localhost:3000/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (data.success) {
                setMessage("✅ OTP đã được gửi về email của bạn!");
                localStorage.setItem("email", email);
                setTimeout(() => {
                    navigate("/verify-otp");
                }, 1500);
            } else {
                setMessage(data.message || "❌ Gửi OTP thất bại!");
            }
        } catch (err) {
            setMessage("❌ Lỗi kết nối server!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-green-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border"
            >
                <h2 className="text-2xl font-bold text-center mb-6 text-black-600">
                    Quên mật khẩu
                </h2>

                {message && (
                    <p
                        className={`mb-4 text-center font-medium ${message.includes("✅") ? "text-green-600" : "text-red-500"
                            }`}
                    >
                        {message}
                    </p>
                )}

                <input
                    type="email"
                    placeholder="Nhập email đăng ký"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 mb-6 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-blue-500 transition"
                >
                    {loading ? "Đang gửi OTP..." : "Gửi OTP"}
                </button>
            </form>
        </div>
    );
};

export default ForgotPassword;
