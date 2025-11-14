import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import InputField from "../../components/Login/InputField";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading } = useSelector((state) => state.auth);

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState(null);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const res = await axios.post(
                "http://localhost:8080/api/auth/login",
                form
            );
            const data = res.data;

            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userName", data.name);
                localStorage.setItem("userEmail", data.email);
                localStorage.setItem("userRole", data.role);

                dispatch(loginUser(data));

                switch (data.role) {
                    case "ADMIN":
                        navigate("/admin/dashboard");
                        break;
                    case "STAFF":
                        navigate("/staff");
                        break;
                    default:
                        navigate("/home");
                        break;
                }
            } else {
                setError("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
            }
        } catch (err) {
            console.error("Login error:", err.response?.data || err.message);
            setError(err.response?.data?.message || "Lỗi server. Vui lòng thử lại.");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200"
            >
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    Đăng nhập
                </h2>

                {error && (
                    <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm text-center mb-4 border border-red-200">
                        {error}
                    </p>
                )}

                <InputField
                    label="Email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="Nhập email của bạn"
                    autoFocus
                />

                <div className="mb-5"></div>

                <InputField
                    label="Mật khẩu"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Nhập mật khẩu"
                />

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
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>

                <div className="flex justify-between mt-5 text-sm">
                    <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-black-600 hover:underline font-medium"
                    >
                        Quên mật khẩu?
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="text-black-600 hover:underline font-medium"
                    >
                        Chưa có tài khoản? Đăng ký
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
