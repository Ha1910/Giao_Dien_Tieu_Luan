import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function VerifyOTP() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const savedEmail = localStorage.getItem("email");
        if (savedEmail) setEmail(savedEmail);
    }, []);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("http://localhost:3000/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp_code: otp }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage("✅ Xác thực thành công! Vui lòng đăng nhập.");
                setTimeout(() => {
                    navigate("/login");
                }, 1000);
            } else {
                setMessage(data.message || "❌ Xác thực thất bại!");
            }
        } catch (err) {
            setMessage("❌ Lỗi kết nối server!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-100 via-white to-green-100">
            <form
                onSubmit={handleVerify}
                className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-200"
            >
                <h2 className="text-3xl font-bold text-center mb-8 text-green-700">Xác thực OTP</h2>

                {message && (
                    <p
                        className={`mb-6 text-center font-medium ${message.includes("thành công") ? "text-green-600" : "text-red-500"
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
                    required
                    className="w-full px-5 py-3 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                />
                <input
                    type="text"
                    placeholder="Nhập mã OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full px-5 py-3 mb-6 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold"
                >
                    {loading ? "Đang xác thực..." : "Xác thực"}
                </button>
            </form>
        </div>
    );
}

export default VerifyOTP;
