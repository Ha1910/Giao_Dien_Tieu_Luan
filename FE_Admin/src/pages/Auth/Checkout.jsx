import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        shipping_address: "",
        notes: "",
        payment_method: "COD",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");


            const res = await axios.post(
                "http://localhost:3000/api/orders/from-cart",
                form,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newOrder = res.data.order; // giả sử backend trả về đơn hàng vừa tạo
            alert("Đặt hàng thành công!");

            setForm({ shipping_address: "", notes: "", payment_method: "COD" });

            // Chuyển trang và truyền đơn hàng mới
            navigate("/order-history", { state: { newOrder } });

        } catch {
            alert("Đặt hàng thất bại.");
        }
    };


    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg">
            <h2 className="text-xl font-bold text-green-700 mb-4">Thanh toán đơn hàng</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold">Địa chỉ giao hàng</label>
                    <input
                        type="text"
                        value={form.shipping_address}
                        onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                        className="w-full border rounded-lg p-2"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold">Ghi chú</label>
                    <textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full border rounded-lg p-2"
                        rows="2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold">Phương thức thanh toán</label>
                    <select
                        value={form.payment_method}
                        onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                        className="w-full border rounded-lg p-2"
                    >
                        <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                        <option value="BANK">Chuyển khoản ngân hàng</option>
                        <option value="PAYPAL">PayPal</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                    Xác nhận đặt hàng
                </button>
            </form>
        </div>
    );
};

export default Checkout;
