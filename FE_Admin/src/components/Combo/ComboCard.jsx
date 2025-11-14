// src/components/Combo/ComboCard.jsx
import { useState } from "react";
import { Card, CardContent } from "./Card";   // ← sửa import

export default function ComboCard({ combo, onQuantityChange }) {
    const [quantity, setQuantity] = useState(0);

    const handleIncrease = () => {
        const newQty = quantity + 1;
        setQuantity(newQty);
        onQuantityChange(combo.comboID, newQty);
    };

    const handleDecrease = () => {
        const newQty = Math.max(quantity - 1, 0);
        setQuantity(newQty);
        onQuantityChange(combo.comboID, newQty);
    };

    return (
        <Card>   {/* có thể thêm key={combo.comboID} nếu dùng độc lập */}
            {/* <img ... /> */}
            <CardContent>
                <h2 className="text-xl font-semibold">{combo.nameCombo}</h2>
                <p className="text-gray-300">{combo.description}</p>
                <p className="font-bold text-purple-400 text-lg">
                    {(combo.price || 0).toLocaleString()} đ
                </p>

                <button
                    className="w-full mt-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
                    onClick={() => alert(`Bạn chọn combo: ${combo.nameCombo}`)}
                >
                    Chọn Combo
                </button>

                <div className="flex justify-center items-center gap-4 mt-4">
                    <button
                        onClick={handleDecrease}
                        disabled={quantity === 0}
                        className="px-4 py-2 bg-white/20 rounded-lg text-xl hover:bg-white/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        −
                    </button>
                    <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                    <button
                        onClick={handleIncrease}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-xl hover:bg-orange-600 transition font-bold"
                    >
                        +
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}