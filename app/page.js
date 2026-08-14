'use client';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import Link from 'next/link';

const PropertyCard = ({ item, contactPhone }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const images = item.images && item.images.length > 0 ? item.images : [];
  
  const nextImg = (e) => { e.preventDefault(); if (currentImg < images.length - 1) setCurrentImg(currentImg + 1); };
  const prevImg = (e) => { e.preventDefault(); if (currentImg > 0) setCurrentImg(currentImg - 1); };

  return (
    <Link href={`/property/${item.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col">
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
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-800 uppercase shadow-sm z-10">
          {item.loaiCan || item.type}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">MÃ CĂN: {item.maCan || 'ĐANG CẬP NHẬT'}</p>
        
        <div className="mb-4 pb-3 border-b border-gray-100">
           <h3 className="font-extrabold text-blue-900 text-lg uppercase tracking-tight group-hover:text-orange-500 transition-colors">
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
          <div className="text-xl font-extrabold text-orange-600 mb-4">
            {item.price} <span className="text-xs font-medium text-gray-500">{item.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'triệu/tháng'}</span>
          </div>
          <div className="flex gap-2">
            <object className="flex-1"><a href={`tel:${contactPhone}`} className="block w-full bg-white border border-orange-500 text-orange-600 hover:bg-orange-50 text-center py-2.5 rounded-lg text-sm font-semibold transition flex justify-center items-center gap-1.5">Liên hệ</a></object>
            <object className="flex-1"><a href={`https://zalo.me/${contactPhone}`} target="_blank" rel="noreferrer" className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded-lg text-sm font-semibold transition flex justify-center items-center gap-1.5 shadow-sm">Zalo</a></object>
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

  const [filters, setFilters] = useState({
    phanKhu: 'Tất cả phân khu',
    loaiCan: 'Tất cả loại căn',
    khoangTang: 'Tất cả tầng',
    huongBanCong: 'Tất cả hướng',
    noiThat: 'Tất cả nội thất'
  });

  const CONTACT_PHONE = "0912791925";

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProperties(data);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      }
      setLoading(false);
    };
    fetchProperties();
  }, []);

  const handleFilterChange = (e) => { setFilters({ ...filters, [e.target.name]: e.target.value }); };
  const handleLoaiCanClick = (type) => { setFilters({ ...filters, loaiCan: filters.loaiCan === type ? 'Tất cả loại căn' : type }); };

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
    if (sortBy === 'priceAsc') {
      return a.price - b.price;
    } else {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    }
  });

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            {/* LOGO NHÀ CÓ TÍCH XÁC MINH */}
            <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm">
              <path fill="#1e3a8a" d="M12 2L1 12h3v9h16v-9h3L12 2z"/>
              <path fill="#f97316" d="M10.5 16.5l-3-3 1.41-1.41 1.59 1.59 4.59-4.59L16.5 10.5l-6 6z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-blue-900 leading-none uppercase tracking-widest mb-1">Quỹ Căn Smart City</h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Kênh phân phối BĐS Uy Tín</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <a href={`tel:${CONTACT_PHONE}`} className="bg-orange-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-orange-600 transition text-sm shadow-md flex items-center gap-2">
             Liên hệ
           </a>
        </div>
      </header>

      <section className="relative bg-gray-900 text-white py-20 px-4 md:px-12 flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/80 to-transparent"></div>
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <p className="text-xs font-semibold text-orange-400 mb-3 uppercase tracking-[0.2em]">Vinhomes Smart City</p>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-[1.15] tracking-tight">Quỹ căn chuyển nhượng<br/>& cho thuê</h2>
          <p className="text-sm md:text-base text-gray-200 max-w-lg font-light leading-relaxed">Bảng hàng cập nhật theo giờ — chọn căn đúng nhu cầu tại Vinhomes Smart City.</p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-6 w-full">
        <div className="flex gap-2 border-b border-gray-200">
           <button onClick={() => {setActiveTab('Cho thuê'); setFilters({...filters, loaiCan: 'Tất cả loại căn'})}} className={`py-3 px-6 text-sm font-bold transition relative ${activeTab === 'Cho thuê' ? 'text-blue-900' : 'text-gray-500 hover:text-gray-800'}`}>
             Cho thuê
             {activeTab === 'Cho thuê' && <div className="absolute bottom-[-1px] left-0 w-full h-1 bg-orange-500 rounded-t"></div>}
           </button>
           <button onClick={() => {setActiveTab('Chuyển nhượng'); setFilters({...filters, loaiCan: 'Tất cả loại căn'})}} className={`py-3 px-6 text-sm font-bold transition relative ${activeTab === 'Chuyển nhượng' ? 'text-blue-900' : 'text-gray-500 hover:text-gray-800'}`}>
             Chuyển nhượng (Bán)
             {activeTab === 'Chuyển nhượng' && <div className="absolute bottom-[-1px] left-0 w-full h-1 bg-orange-500 rounded-t"></div>}
           </button>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start flex-grow w-full">
        <aside className="w-full lg:w-[280px] flex-shrink-0 bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24 self-start">
          <h3 className="font-bold text-lg mb-6 text-blue-900">Bộ lọc chi tiết</h3>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Phân khu</label>
              <select name="phanKhu" value={filters.phanKhu} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-orange-500 outline-none">
                <option>Tất cả phân khu</option>
                {['Sapphire', 'Miami', 'Sakura', 'Victoria', 'Imperia', 'Sola Park', 'Tonkin', 'Canopy', 'Masteri West Height', 'Lumiere Evergreen'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Loại căn</label>
              <div className="grid grid-cols-2 gap-2">
                 {['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(type => (
                   <button key={type} onClick={() => handleLoaiCanClick(type)} className={`border py-1.5 rounded text-[11px] font-medium transition ${filters.loaiCan === type ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:border-orange-400'}`}>
                     {type}
                   </button>
                 ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Khoảng tầng</label>
              <select name="khoangTang" value={filters.khoangTang} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-orange-500 outline-none">
                <option>Tất cả tầng</option>
                {['Tầng thấp', 'Tầng trung', 'Tầng cao'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Hướng ban công</label>
              <select name="huongBanCong" value={filters.huongBanCong} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-orange-500 outline-none">
                <option>Tất cả hướng</option>
                {['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Hiện trạng nội thất</label>
              <select name="noiThat" value={filters.noiThat} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-orange-500 outline-none">
                <option>Tất cả nội thất</option>
                {['Nguyên bản CĐT', 'Đồ cơ bản', 'Đầy đủ nội thất'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </aside>

        <section className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4 sm:border-0 sm:pb-0 border-gray-200">
             <div>
               <h3 className="text-xl font-bold text-blue-900 inline-block mr-2">{activeTab}</h3>
               <span className="text-[13px] font-normal text-gray-500 inline-block mt-1 sm:mt-0">Tìm thấy {sortedProperties.length} căn hộ phù hợp</span>
             </div>
             
             <div className="flex items-center gap-2 w-full sm:w-auto bg-gray-100 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:block">Sắp xếp:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto text-sm border-gray-200 rounded-md border py-2 px-3 text-gray-700 focus:outline-none focus:border-orange-500 bg-white cursor-pointer shadow-sm">
                  <option value="newest">⏳ Cập nhật mới nhất</option>
                  <option value="priceAsc">📈 Giá từ thấp đến cao</option>
                </select>
             </div>
          </div>

          {sortedProperties.length === 0 ? (
             <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                <p className="text-gray-500">Chưa có quỹ căn phù hợp với bộ lọc của bạn.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {sortedProperties.map(item => (
                <PropertyCard key={item.id} item={item} contactPhone={CONTACT_PHONE} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 py-10 px-4 md:px-12 w-full">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between gap-8 text-sm text-gray-500">
           <div className="max-w-md">
             <div className="flex items-center gap-2 mb-4">
               <div className="w-8 h-8 flex items-center justify-center">
                 <svg viewBox="0 0 24 24" className="w-full h-full">
                   <path fill="#1e3a8a" d="M12 2L1 12h3v9h16v-9h3L12 2z"/>
                   <path fill="#f97316" d="M10.5 16.5l-3-3 1.41-1.41 1.59 1.59 4.59-4.59L16.5 10.5l-6 6z"/>
                 </svg>
               </div>
               <span className="font-bold text-blue-900 tracking-widest uppercase text-xs">QUỸ CĂN SMART CITY</span>
             </div>
             <p className="text-xs leading-relaxed font-light">Cổng thông tin dữ liệu về căn hộ chuyển nhượng, cho thuê và đời sống cư dân. Không phải website của chủ đầu tư.</p>
           </div>
           <div>
             <p className="font-bold text-blue-900 mb-3 text-xs uppercase tracking-wider">Liên hệ</p>
             <p className="mb-1.5 font-light">Hotline: <a href={`tel:${CONTACT_PHONE}`} className="text-gray-600 font-medium hover:text-orange-500">{CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a></p>
             <p className="mb-1.5 font-light">Zalo: <a href={`https://zalo.me/${CONTACT_PHONE}`} className="text-gray-600 font-medium hover:text-orange-500">{CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a></p>
             <p className="font-light">Đại lộ Thăng Long, Nam Từ Liêm, Hà Nội</p>
           </div>
        </div>
      </footer>
    </div>
  );
}