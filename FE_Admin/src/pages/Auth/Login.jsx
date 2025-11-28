import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Film, AlertCircle } from "lucide-react";

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading } = useSelector((state) => state.auth);

    const [form, setForm] = useState({
        email: "admin@rapphim.com",
        password: "admin123"
    });
    const [error, setError] = useState(null);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            console.log("Đang gửi request đăng nhập:", form);

            const res = await axios.post(
                "http://localhost:8080/api/auth/login",
                {
                    email: form.email,
                    password: form.password
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            const data = res.data;
            console.log("Phản hồi từ server:", data);

            // Giả sử response có token và các thông tin user
            if (data.token) {
                // Lưu thông tin vào localStorage
                localStorage.setItem("token", data.token);
                localStorage.setItem("userName", data.name || data.username || "Admin");
                localStorage.setItem("userEmail", data.email || form.email);
                localStorage.setItem("userRole", data.role || "ADMIN");

                // Dispatch action đăng nhập
                if (dispatch && typeof dispatch === 'function') {
                    dispatch({
                        type: 'LOGIN_SUCCESS',
                        payload: data
                    });
                }

                // Chuyển hướng dựa trên role
                switch (data.role) {
                    case "ADMIN":
                        navigate("/home");
                        break;
                    case "STAFF":
                        navigate("/staff");
                        break;
                    default:
                        navigate("/customer");
                        break;
                }
            } else {
                setError("Đăng nhập thất bại: Không nhận được token từ server");
            }
        } catch (err) {
            console.error("Login error:", err);

            if (err.response) {
                // Lỗi từ server (4xx, 5xx)
                const errorMessage = err.response.data?.message ||
                    err.response.data?.error ||
                    `Lỗi ${err.response.status}: ${err.response.statusText}`;
                setError(errorMessage);
            } else if (err.request) {
                // Không nhận được phản hồi
                setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang chạy trên port 8080.");
            } else {
                // Lỗi khác
                setError("Lỗi đăng nhập: " + err.message);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                            <Film className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">CinemaPro</h1>
                    </div>
                    <p className="text-white/70">Hệ thống quản lý rạp chiếu phim</p>
                </div>

                {/* Login Form */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <h2 className="text-2xl font-bold text-white text-center mb-6">
                        Đăng nhập hệ thống
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-white backdrop-blur-lg">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-white/80 mb-2 text-sm font-medium">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="Nhập email của bạn"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>

                        <div>
                            <label className="block text-white/80 mb-2 text-sm font-medium">
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="Nhập mật khẩu"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 shadow-lg ${loading
                                ? "bg-gray-500/50 cursor-not-allowed opacity-70"
                                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-95"
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Đang đăng nhập...
                                </div>
                            ) : (
                                "Đăng nhập"
                            )}
                        </button>
                    </form>



                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-white/50 text-sm">
                        © 2024 CinemaPro. Hệ thống quản lý rạp chiếu phim.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;