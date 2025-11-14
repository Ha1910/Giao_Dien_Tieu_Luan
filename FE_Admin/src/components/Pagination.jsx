import React from 'react';

const Pagination = ({ pagination, onPageChange }) => {
  console.log('Pagination data:', pagination);
  
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { page: currentPage, totalPages, hasNext, hasPrev } = pagination;

  // Tạo danh sách các trang để hiển thị
  const getPageNumbers = () => {
    const delta = 2; // Số trang hiển thị ở mỗi bên của trang hiện tại
    const range = [];
    const rangeWithDots = [];

    // Luôn hiển thị trang đầu
    range.push(1);

    // Tính toán khoảng trang cần hiển thị xung quanh trang hiện tại
    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    // Luôn hiển thị trang cuối (nếu totalPages > 1)
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Thêm dấu "..." nếu cần
    let l = range[0];
    for (let i of range) {
      if (l + 1 < i) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      {/* Previous button */}
      <button
        disabled={!hasPrev || currentPage <= 1}
        onClick={() => {
          console.log('Previous button clicked, current page:', currentPage);
          onPageChange(currentPage - 1);
        }}
        className={`px-3 py-2 border rounded-lg transition-colors ${
          !hasPrev || currentPage <= 1
            ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
            : 'hover:bg-gray-50 bg-white text-gray-700 cursor-pointer'
        }`}
      >
        ← Trước
      </button>

      {/* Page numbers */}
      {pageNumbers.map((number, index) => (
        number === '...' ? (
          <span key={`dots-${index}`} className="px-2 py-2 text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={number}
            onClick={() => {
              console.log('Page number clicked:', number);
              onPageChange(number);
            }}
            className={`px-3 py-2 border rounded-lg transition-colors cursor-pointer ${
              currentPage === number
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {number}
          </button>
        )
      ))}

      {/* Next button */}
      <button
        disabled={!hasNext || currentPage >= totalPages}
        onClick={() => {
          console.log('Next button clicked, current page:', currentPage);
          onPageChange(currentPage + 1);
        }}
        className={`px-3 py-2 border rounded-lg transition-colors ${
          !hasNext || currentPage >= totalPages
            ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
            : 'hover:bg-gray-50 bg-white text-gray-700 cursor-pointer'
        }`}
      >
        Sau →
      </button>

      {/* Page info */}
      <div className="ml-4 text-sm text-gray-600">
        Trang {currentPage} / {totalPages}
      </div>
    </div>
  );
};

export default Pagination;
