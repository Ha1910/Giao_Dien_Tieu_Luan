import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
                        navigate("/");
                        break;
                    case "STAFF":
                        navigate("/staff");
                        break;
                    default:
                        navigate("/home");
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
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200"
            >
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    Đăng nhập Hệ thống
                </h2>

                {error && (
                    <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm text-center mb-4 border border-red-200">
                        {error}
                    </p>
                )}

                <div className="mb-5">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="Nhập email của bạn"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                    />
                </div>

                <div className="mb-5">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder="Nhập mật khẩu"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full mt-6 py-3 rounded-lg font-bold text-white text-lg 
                        transition-all duration-300 shadow-md
                        ${loading
                            ? "bg-gray-400 cursor-not-allowed opacity-70"
                            : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                        }`}
                >
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>

                <div className="flex justify-between mt-5 text-sm">
                    <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Quên mật khẩu?
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Đăng ký tài khoản
                    </button>
                </div>


            </form>
        </div>
    );
};

export default Login;