import { useEffect, useState } from "react";
import axios from "axios";
import Header from "../../components/layout/Header";
import ComboCard from "../../components/Combo/ComboCard";

export default function ComboList() {
    const [combos, setCombos] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("Bắt đầu gọi API combos...");
        const fetchCombos = async () => {
            try {
                const res = await axios.get("http://localhost:8080/api/combos");
                setCombos(res.data);
            } catch (err) {
                setError("Không thể tải danh sách combo");
            } finally {
                setLoading(false);
            }
        };
        fetchCombos();
    }, []);

    const handleQuantityChange = (id, qty) => {
        setQuantities((prev) => ({ ...prev, [id]: qty }));
    };

    if (loading) return <p className="text-center text-lg">Đang tải...</p>;
    if (error) return <p className="text-center text-red-600">{error}</p>;

    return (
        <>
            <Header />
            <div className="p-6 max-w-6xl mx-auto bg-gradient-to-b from-[#0A0F2C] to-[#2B1E5A] min-h-screen text-white">
                <h1 className="text-3xl font-bold mb-6 text-center">Danh Sách Combo</h1>

                {/* Summary Bar */}
                <div className="bg-[#0B122E] p-5 rounded-xl flex justify-between items-center mb-6 border border-white/10">
                    <div>
                        <h2 className="text-xl font-bold">Tạm tính</h2>
                        <p className="text-gray-300">Tổng tiền combo bạn chọn</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                            {Object.keys(quantities)
                                .reduce((total, id) => {
                                    const combo = combos.find((c) => c.comboID == id);
                                    const price = combo?.price || 0;
                                    return total + price * (quantities[id] || 0);
                                }, 0)
                                .toLocaleString()}{" "}
                            VND
                        </p>
                        <button className="mt-2 px-6 py-2 border rounded-lg hover:bg-white/10">
                            THANH TOÁN
                        </button>
                    </div>
                </div>


                {/* Combo List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {combos
                        .filter(combo => combo && combo.comboID) // Lọc combo hợp lệ
                        .map((combo) => (
                            <ComboCard
                                key={combo.comboID}
                                combo={combo}
                                onQuantityChange={handleQuantityChange}
                            />
                        ))}
                </div>
            </div>
        </>
    );
}
