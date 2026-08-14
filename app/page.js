'use client';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import Link from 'next/link';

const PropertyCard = ({ item, contactPhone }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const images = item.images && item.images.length > 0 ? item.images : [];
  
  const nextImg = (e) => { e.preventDefault(); if (currentImg < images.length - 1) setCurrentImg(currentImg + 1); };
  const prevImg = (e) => { e.preventDefault(); if (currentImg > 0) setCurrentImg(currentImg - 1); };

  return (
    <Link href={`/property/${item.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col">
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        {images.length > 0 ? (
          <img src={images[currentImg]} alt="Căn hộ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Chưa có ảnh</div>
        )}
        
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10">‹</button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10">›</button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
              {images.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all ${currentImg === idx ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`}></div>
              ))}
            </div>
          </>
        )}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-bold text-blue-900 uppercase shadow-sm z-10">
          {item.loaiCan || item.type}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">MÃ CĂN: {item.maCan || 'ĐANG CẬP NHẬT'}</p>
        <div className="mb-4 pb-3 border-b border-gray-100">
           <h3 className="font-bold text-blue-900 text-lg uppercase tracking-tight group-hover:text-blue-600 transition-colors">
             {item.phanKhu} - Tòa {item.toaNha || item.building}
           </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-[11px] text-gray-600 mb-5">
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🏢</span> {item.khoangTang || 'Đang cập nhật'}</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">📐</span> {item.area} m²</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🧭</span> {item.huongBanCong || 'Đang cập nhật'}</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🛋️</span> {item.noiThat || 'Đang cập nhật'}</div>
        </div>

        <div className="mt-auto">
          <div className="text-xl font-bold text-blue-700 mb-4">
            {item.listingType === 'Chuyển nhượng' ? 'Giá bán: ' : 'Giá thuê: '} {item.price} <span className="text-xs font-medium text-gray-500">{item.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'Triệu/tháng'}</span>
          </div>
          <div className="flex gap-2">
            <object className="flex-1"><a href={`tel:${contactPhone}`} className="block w-full bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 text-center py-2.5 rounded-md text-sm font-semibold transition flex justify-center items-center gap-1.5">Liên hệ</a></object>
            <object className="flex-1"><a href={`https://zalo.me/${contactPhone}`} target="_blank" rel="noreferrer" className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded-md text-sm font-semibold transition flex justify-center items-center gap-1.5 shadow-sm">Zalo</a></object>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Cho thuê');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [filters, setFilters] = useState({ phanKhu: 'Tất cả phân khu', loaiCan: 'Tất cả loại căn', khoangTang: 'Tất cả tầng', huongBanCong: 'Tất cả hướng', noiThat: 'Tất cả nội thất' });
  const CONTACT_PHONE = "0912791925";

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProperties(data);
      } catch (error) { console.error("Lỗi lấy dữ liệu:", error); }
      setLoading(false);
    };
    fetchProperties();
  }, []);

  const handleFilterChange = (e) => { setFilters({ ...filters, [e.target.name]: e.target.value }); setCurrentPage(1); };
  const handleLoaiCanClick = (type) => { setFilters({ ...filters, loaiCan: filters.loaiCan === type ? 'Tất cả loại căn' : type }); setCurrentPage(1); };

  const filteredProperties = properties.filter(item => {
    const matchTab = item.listingType === activeTab || (!item.listingType && activeTab === 'Cho thuê');
    const matchPhanKhu = filters.phanKhu === 'Tất cả phân khu' || item.phanKhu === filters.phanKhu;
    const matchLoaiCan = filters.loaiCan === 'Tất cả loại căn' || item.loaiCan === filters.loaiCan || item.type === filters.loaiCan;
    const matchKhoangTang = filters.khoangTang === 'Tất cả tầng' || item.khoangTang === filters.khoangTang;
    const matchHuong = filters.huongBanCong === 'Tất cả hướng' || item.huongBanCong === filters.huongBanCong;
    const matchNoiThat = filters.noiThat === 'Tất cả nội thất' || item.noiThat === filters.noiThat;
    return matchTab && matchPhanKhu && matchLoaiCan && matchKhoangTang && matchHuong && matchNoiThat;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'priceAsc') return a.price - b.price;
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
  const currentProperties = sortedProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center hover:opacity-80 transition">
          <img src="/logo.png" alt="Quỹ Căn Smart City" className="h-10 md:h-12 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-4">
           <Link href="/ky-gui" className="hidden md:block text-blue-900 font-bold hover:text-blue-600 transition text-sm">Ký gửi căn hộ</Link>
           <a href={`https://zalo.me/${CONTACT_PHONE}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b5852a] text-gray-900 px-5 py-2 rounded-full font-bold hover:opacity-90 transition shadow-md text-sm">
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.2-.6-2.4-.6-3.6 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1zM19 12h2a9 9 0 00-9-9v2c3.9 0 7.1 3.2 7.1 7.1zM15 12h2c0-2.8-2.2-5-5-5v2c1.7 0 3 1.3 3 3z"/></svg>
             Liên hệ tư vấn
           </a>
        </div>
      </header>
      
      {/*... GIỮ NGUYÊN HERO SECTION VÀ BỘ LỌC ...*/}
      
      {/* KHỐI NHỜ TÌM CĂN (TRỎ ZALO) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm mb-10 w-full mt-8 max-w-[1400px] mx-auto px-4 md:px-8">
        <div>
            <h4 className="text-xl font-bold text-blue-900 mb-2">Không cần tự lướt hết quỹ căn</h4>
            <p className="text-sm text-gray-600">Gửi nhu cầu của bạn, chúng tôi sẽ chọn 3-5 căn phù hợp nhất để gửi lại bạn nhanh nhất.</p>
        </div>
        <a href={`https://zalo.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Xin chào, tôi muốn nhờ tìm giúp một căn hộ ${activeTab} tại Vinhomes Smart City.`)}`} target="_blank" rel="noreferrer" className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-3 rounded-md font-bold whitespace-nowrap transition shadow flex items-center gap-2 w-full md:w-auto justify-center">
            Nhờ tìm căn phù hợp
        </a>
      </div>
      
      <footer className="bg-white border-t border-gray-200 py-12 px-4 md:px-12 w-full mt-auto">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-sm text-gray-600">
           <div className="md:pr-10">
             <div className="flex items-center mb-6"><img src="/logo.png" alt="Quỹ Căn Smart City Logo" className="h-10 md:h-12 w-auto object-contain" /></div>
             <p className="leading-relaxed font-light mb-4">Quỹ Căn Smart City – Chuyên trang tổng hợp nguồn hàng mua bán, chuyển nhượng, cho thuê căn hộ tại Vinhomes Smart City Tây Mỗ. Cập nhật quỹ căn mới mỗi ngày tại mọi phân khu.</p>
             <p className="text-xs text-gray-400">© 2026 Quỹ Căn Smart City.</p>
           </div>
           <div className="md:pl-10 md:border-l border-gray-100">
             <h3 className="font-extrabold text-blue-900 mb-5 text-lg uppercase tracking-wider">Liên hệ tư vấn</h3>
             <div className="space-y-4 font-light text-[15px]">
               <p className="flex items-center gap-3">👤 <strong className="text-gray-800">Nguyễn An Ninh</strong></p>
               <p className="flex items-center gap-3">📞 <a href={`tel:${CONTACT_PHONE}`} className="font-bold text-blue-600 hover:text-blue-800 transition text-lg">{CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a> <span className="text-gray-400 text-xs ml-1">(SĐT / Zalo)</span></p>
               <p className="flex items-center gap-3">📍 Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội</p>
             </div>
           </div>
        </div>
      </footer>
    </div>
  );
}