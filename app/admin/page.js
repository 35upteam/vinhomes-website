'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Đã sửa đường dẫn
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

export default function AdminPage() {
  // ... (giữ nguyên logic fetch, handleSubmit, handleDelete...)
  // ... (CHỈ THAY ĐỔI CẤU TRÚC BẢNG QUỸ CĂN NHƯ DƯỚI ĐÂY)

  // TRONG PHẦN BẢNG QUỸ CĂN:
  /*
  <table className="w-full text-sm text-left">
    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
      <tr>
        <th className="px-4 py-3 rounded-l-md">
           <div className="flex flex-col gap-1 items-start">
             <span>Mã căn</span>
             <select value={filterType} onChange={(e) => {setFilterType(e.target.value); setCurrentPage(1);}} className="text-[10px] p-0.5 rounded border border-gray-300 font-bold outline-none bg-white cursor-pointer">
               <option value="Tất cả">Tất cả ({countAll})</option>
               <option value="Cho thuê">Cho thuê ({countThu})</option>
               <option value="Chuyển nhượng">Chuyển nhượng ({countBan})</option>
             </select>
           </div>
        </th>
        ...
      </tr>
    </thead>
    ...
  </table>
  */
}