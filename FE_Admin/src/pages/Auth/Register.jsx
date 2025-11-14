import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "CUSTOMER", // mặc định là khách hàng
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    // Xử lý khi người dùng nhập vào input
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Xử lý khi nhấn nút Đăng ký
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await axios.post("http://localhost:8080/api/auth/register", form);
            const data = res.data;

            // ✅ Nếu BE trả về token thì coi như đăng ký thành công
            if (data.token) {
                // Lưu token tạm thời (có thể dùng cho auto-login)
                localStorage.setItem("token", data.token);
                localStorage.setItem("userRole", data.role);
                localStorage.setItem("userEmail", data.email);

                setMessage("✅ Đăng ký thành công! Hệ thống sẽ chuyển hướng đến trang đăng nhập...");
                setTimeout(() => navigate("/login"), 1500);
            } else {
                setMessage("❌ Đăng ký thất bại. Vui lòng thử lại!");
            }
        } catch (err) {
            console.error("Register error:", err.response?.data || err.message);
            setMessage(err.response?.data?.message || "❌ Đăng ký thất bại, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-green-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
            >
                <h2 className="text-2xl font-bold text-center mb-6 text-black-700">
                    Đăng ký tài khoản
                </h2>

                {/* Thông báo */}
                {message && (
                    <p
                        className={`mb-4 text-center ${message.includes("thành công") ? "text-green-600" : "text-red-500"
                            }`}
                    >
                        {message}
                    </p>
                )}

                {/* Họ tên */}
                <input
                    type="text"
                    name="name"
                    placeholder="Họ và tên"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring focus:ring-green-400"
                    required
                />

                {/* Email */}
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring focus:ring-green-400"
                    required
                />

                {/* Mật khẩu */}
                <input
                    type="password"
                    name="password"
                    placeholder="Mật khẩu"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring focus:ring-green-400"
                    required
                />

                {/* Role */}
                <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mb-6 border rounded-lg focus:outline-none focus:ring focus:ring-green-400"
                    required
                >
                    <option value="CUSTOMER">Khách hàng</option>
                    <option value="STAFF">Nhân viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                    <option value="GUEST">Khách</option>
                </select>

                {/* Nút đăng ký */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full mt-6 py-3 rounded-lg font-bold text-white text-lg 
                transition-all duration-300 shadow-md
                ${loading
                            ? "bg-gray-400 cursor-not-allowed opacity-70"
                            : "bg-yellow-500 hover:bg-blue-600 active:bg-blue-700"
                        }`}
                >
                    {loading ? "Đang đăng ký..." : "Đăng ký"}
                </button>

                <div className="flex justify-center mt-4">
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-sm text-black-600 hover:underline"
                    >
                        Đã có tài khoản? Đăng nhập
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Register;
