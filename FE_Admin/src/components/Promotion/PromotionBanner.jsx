// components/PromotionCarousel.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const promotions = [
    {
        id: 1,
        title: "MUA VÉ ONLINE - Rinh quà Chaching",
        period: "Từ 01.10 đến 31.12.2025",
        condition: "Hóa đơn trên 250k tại Web / App Cinestar",
        prize: "tham gia VÒNG XOAY MAY MẮN",
        winRate: "100% trúng 1 trong 4 phần quà",
        gifts: ["Áo Chaching", "Nón Chaching", "Voucher 50k", "C Green"],
        girlImage: "https://via.placeholder.com/300x400/f9e4e4/ffffff?text=Chaching+Girl",
        bgGradient: "from-orange-400 to-red-500",
    },
    {
        id: 2,
        title: "ƯU ĐÃI THÀNH VIÊN",
        period: "Tháng 11/2025",
        condition: "Mua 2 vé tặng 1 bắp nước",
        prize: "Combo đặc biệt chỉ 99k",
        winRate: "Áp dụng cho thành viên VIP",
        gifts: ["Bắp rang", "Nước ngọt", "Voucher 20k"],
        girlImage: "https://via.placeholder.com/300x400/c8f7c5/000000?text=VIP+Girl",
        bgGradient: "from-green-400 to-teal-600",
    },
    {
        id: 3,
        title: "HAPPY DAY - GIẢM 50%",
        period: "Thứ 4 hàng tuần",
        condition: "Đặt vé online trước 12h",
        prize: "Giảm ngay 50k/vé",
        winRate: "Không giới hạn số lượng",
        gifts: ["Giảm giá", "Tặng ghế đôi", "Nước miễn phí"],
        girlImage: "https://via.placeholder.com/300x400/fff3cd/000000?text=Happy+Day",
        bgGradient: "from-yellow-400 to-amber-600",
    },
];

const PromotionCarousel = () => {
    return (
        <section className="py-8 bg-gradient-to-r from-orange-50 to-pink-50">
            <div className="container mx-auto px-4">
                <Swiper
                    modules={[Navigation, Autoplay]}
                    spaceBetween={30}
                    slidesPerView={1}
                    loop={true}
                    autoplay={{
                        delay: 4000,
                        disableOnInteraction: false,
                    }}
                    navigation={{
                        prevEl: ".promo-prev",
                        nextEl: ".promo-next",
                    }}
                    className="promotion-swiper rounded-2xl overflow-hidden shadow-2xl"
                >
                    {promotions.map((promo) => (
                        <SwiperSlide key={promo.id}>
                            <div className="bg-white rounded-2xl overflow-hidden">
                                {/* Nội dung chính */}
                                <div className={`relative grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-8 items-center bg-gradient-to-r ${promo.bgGradient}`}>
                                    {/* Cột 1: Logo + Tiêu đề */}
                                    <div className="text-center md:text-left space-y-3">
                                        <img
                                            src="/cinestar-logo-white.png"
                                            alt="Cinestar"
                                            className="h-10 mx-auto md:mx-0"
                                        />
                                        <h2 className="text-2xl md:text-3xl font-bold text-yellow-300 drop-shadow-lg">
                                            {promo.title.split(" - ")[0]}
                                        </h2>
                                        {promo.title.includes(" - ") && (
                                            <h3 className="text-xl md:text-2xl font-bold text-white">
                                                {promo.title.split(" - ")[1]}
                                            </h3>
                                        )}
                                    </div>

                                    {/* Cột 2: Nội dung */}
                                    <div className="text-white space-y-3 text-center md:text-left">
                                        <div className="bg-white/30 backdrop-blur-sm inline-block px-4 py-1.5 rounded-full text-sm font-bold">
                                            {promo.period}
                                        </div>
                                        <p className="text-sm md:text-base font-medium">
                                            {promo.condition}
                                            <br />
                                            <span className="text-yellow-300 font-bold text-lg">
                                                {promo.prize}
                                            </span>
                                        </p>
                                        <p className="text-green-300 font-bold text-sm">
                                            {promo.winRate}
                                        </p>

                                        <div className="flex justify-center md:justify-start gap-2 flex-wrap mt-3">
                                            {promo.gifts.map((gift, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-white/30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium"
                                                >
                                                    {gift}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Cột 3: Hình + Nút */}
                                    <div className="flex flex-col items-center space-y-4">
                                        <img
                                            src={promo.girlImage}
                                            alt="Model"
                                            className="w-48 md:w-64 rounded-xl shadow-2xl"
                                        />
                                        <button className="px-8 py-3 bg-yellow-400 text-black font-bold text-lg rounded-full hover:bg-yellow-300 transform hover:scale-105 transition-all duration-200 shadow-xl">
                                            ĐẶT VÉ NGAY
                                        </button>
                                    </div>
                                </div>

                                {/* Ghi chú nhỏ */}
                                <div className="bg-gray-50 px-6 py-3 text-xs text-gray-600 border-t">
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Chương trình có thể thay đổi mà không báo trước.</li>
                                        <li>Áp dụng tại các rạp Cinestar trên toàn quốc.</li>
                                    </ul>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Nút điều hướng */}
                <div className="promo-prev !text-white !w-12 !h-12 after:!text-3xl"></div>
                <div className="promo-next !text-white !w-12 !h-12 after:!text-3xl"></div>
            </div>
        </section>
    );
};

export default PromotionCarousel;