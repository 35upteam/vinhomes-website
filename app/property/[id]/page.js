'use client';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../firebase'; // Đã sửa đường dẫn
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ... (Giữ nguyên component MiniPropertyCard)

export default function PropertyDetail() {
  // ... logic lấy dữ liệu giống code trước
  
  // TIÊU ĐỀ MỚI
  const titleString = `${property.listingType === 'Cho thuê' ? 'Cho thuê' : 'Bán'} căn hộ ${property.loaiCan || property.type}, tòa ${property.toaNha || property.building}, phân khu ${property.phanKhu}`;

  // ... (Giao diện)
  // Trong phần hiển thị giá, sửa thành:
  /*
  <div className="text-3xl font-extrabold text-blue-700 bg-blue-50 inline-block px-4 py-2 rounded-lg border border-blue-100">
    {property.listingType === 'Chuyển nhượng' ? 'Giá bán: ' : 'Giá thuê: '} {property.price} 
    <span className="text-xl font-bold text-gray-600">{property.listingType === 'Chuyển nhượng' ? ' Tỷ' : ' Triệu/tháng'}</span>
  </div>
  */
  
  // NÚT CHIA SẺ
  /*
  <button onClick={handleShare} ... >Chia sẻ</button>
  */
}