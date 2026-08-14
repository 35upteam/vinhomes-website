'use client';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// Component Thẻ Căn Hộ đã được tinh chỉnh theo yêu cầu mới
const PropertyCard = ({ item, contactPhone }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const images = item.images && item.images.length > 0 ? item.images : [];
  
  const nextImg = (e) => { e.preventDefault(); if (currentImg < images.length - 1) setCurrentImg(currentImg + 1); };
  const prevImg = (e) => { e.preventDefault(); if (currentImg > 0) setCurrentImg(currentImg - 1); };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col">
      {/* Khối Ảnh */}
      <div className="relative h-56 bg-gray-200 group overflow-hidden">
        {images.length > 0 ? (
          <img src={images[currentImg]} alt="Căn hộ" className="w-full h-full object-cover transition-transform duration-300" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Chưa có ảnh</div>
        )}
        
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">‹</button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">›</button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all ${currentImg === idx ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`}></div>
              ))}
            </div>
          </>
        )}

        {/* Badges Loại Căn */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-800 uppercase shadow-sm">
          {item.loaiCan || item.type}
        </div>
      </div>

      {/* Khối Thông tin MỚI (Bỏ Mã căn, Bỏ Tiêu đề) */}
      <div className="p-4 flex flex-col flex-grow">
        
        {/* Nhấn mạnh Phân khu + Tòa nhà */}
        <div className="mb-4 pb-3 border-b border-gray-100">
           <h3 className="font-extrabold text-[#a07d46] text-lg uppercase tracking-tight">
             {item.phanKhu}
           </h3>
           <p className="text-sm text-gray-700 font-bold mt-1">
             Tòa {item.toaNha || item.building}
           </p>
        </div>
        
        {/* Lưới thông số (Cập nhật lấy từ Database thật) */}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-[11px] text-gray-600 mb-5">
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🏢</span> {item.khoangTang || 'Đang cập nhật'}</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">📐</span> {item.area} m²</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🧭</span> {item.huongBanCong || 'Đang cập nhật'}</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🛋️</span> {item.noiThat || 'Đang cập nhật'}</div>
        </div>

        {/* Giá và Nút */}
        <div className="mt-auto">
          <div className="text-xl font-extrabold text-gray-900 mb-4">
            {item.price} <span className="text-xs font-medium text-gray-500">{item.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'triệu/tháng'}</span>
          </div>
          <div className="flex gap-2">
            <a href={`tel:${contactPhone}`} className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-center py-2.5 rounded-lg text-sm font-semibold transition flex justify-center items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                Liên hệ
            </a>
            <a href={`https://zalo.me/${contactPhone}`} target="_blank" rel="noreferrer" className="flex-1 bg-[#c5a47e] hover:bg-[#b08d66] text-white text-center py-2.5 rounded-lg text-sm font-semibold transition flex justify-center items-center gap-1.5 shadow-sm">
                Zalo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Bộ lọc
  const [activeTab, setActiveTab] = useState('Cho thuê'); // Cho thuê / Chuyển nhượng
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

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleLoaiCanClick = (type) => {
    setFilters({ ...filters, loaiCan: filters.loaiCan === type ? 'Tất cả loại căn' : type });
  };

  // Logic Lọc Dữ Liệu
  const filteredProperties = properties.filter(item => {
    // Luôn lọc theo Tab hiện tại (Cho thuê / Bán)
    const matchTab = item.listingType === activeTab || (!item.listingType && activeTab === 'Cho thuê'); // Cú pháp dự phòng cho dữ liệu cũ
    
    const matchPhanKhu = filters.phanKhu === 'Tất cả phân khu' || item.phanKhu === filters.phanKhu;
    const matchLoaiCan = filters.loaiCan === 'Tất cả loại căn' || item.loaiCan === filters.loaiCan || item.type === filters.loaiCan;
    const matchKhoangTang = filters.khoangTang === 'Tất cả tầng' || item.khoangTang === filters.khoangTang;
    const matchHuong = filters.huongBanCong === 'Tất cả hướng' || item.huongBanCong === filters.huongBanCong;
    const matchNoiThat = filters.noiThat === 'Tất cả nội thất' || item.noiThat === filters.noiThat;

    return matchTab && matchPhanKhu && matchLoaiCan && matchKhoangTang && matchHuong && matchNoiThat;
  });

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#fbfaf7]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c5a47e]"></div></div>;

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-gray-800 font-sans">
      
      {/* HEADER & HERO BANNER (Giữ nguyên giao diện đẹp đã chốt) */}
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-[#c5a47e] text-[#c5a47e] flex items-center justify-center font-serif font-medium text-lg">V</div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none uppercase tracking-widest mb-1">Vinhomes Lifestyle</h1>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest">Căn hộ chuyển nhượng & cho thuê</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <a href={`tel:${CONTACT_PHONE}`} className="bg-[#c5a47e] text-white px-6 py-2 rounded-md font-semibold hover:bg-[#b08d66] transition text-sm shadow-md flex items-center gap-2">
             Liên hệ
           </a>
        </div>
      </header>

      <section className="relative bg-gray-900 text-white py-20 px-4 md:px-12 flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a202c] via-[#1a202c]/80 to-transparent"></div>
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <p className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-[0.2em]">Vinhomes Smart City</p>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-[1.15] tracking-tight">Căn hộ chuyển nhượng<br/>& cho thuê</h2>
          <p className="text-sm md:text-base text-gray-300 max-w-lg font-light leading-relaxed">Bảng hàng cập nhật theo giờ — chọn căn đúng nhu cầu tại Vinhomes Smart City.</p>
        </div>
      </section>

      {/* TABS ĐIỀU HƯỚNG */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex gap-2 border-b border-gray-200">
           <button onClick={() => {setActiveTab('Cho thuê'); setFilters({...filters, loaiCan: 'Tất cả loại căn'})}} className={`py-3 px-6 text-sm font-semibold transition relative ${activeTab === 'Cho thuê' ? 'text-[#c5a47e]' : 'text-gray-500 hover:text-gray-800'}`}>
             Cho thuê
             {activeTab === 'Cho thuê' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#c5a47e]"></div>}
           </button>
           <button onClick={() => {setActiveTab('Chuyển nhượng'); setFilters({...filters, loaiCan: 'Tất cả loại căn'})}} className={`py-3 px-6 text-sm font-semibold transition relative ${activeTab === 'Chuyển nhượng' ? 'text-[#c5a47e]' : 'text-gray-500 hover:text-gray-800'}`}>
             Chuyển nhượng (Bán)
             {activeTab === 'Chuyển nhượng' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#c5a47e]"></div>}
           </button>
        </div>
      </div>

      {/* BỘ LỌC VÀ HIỂN THỊ */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR BỘ LỌC */}
        <aside className="w-full lg:w-[280px] flex-shrink-0 bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24">
          <h3 className="font-bold text-lg mb-6 text-gray-900">Bộ lọc chi tiết</h3>
          
          <div className="space-y-6">
            
            {/* Phân khu */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Phân khu</label>
              <select name="phanKhu" value={filters.phanKhu} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-[#c5a47e] outline-none">
                <option>Tất cả phân khu</option>
                {['Sapphire', 'Miami', 'Sakura', 'Victoria', 'Imperia', 'Sola Park', 'Tonkin', 'Canopy', 'Masteri West Height', 'Lumiere Evergreen'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Grid Nút Loại Căn */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Loại căn</label>
              <div className="grid grid-cols-2 gap-2">
                 {['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(type => (
                   <button key={type} onClick={() => handleLoaiCanClick(type)} className={`border py-1.5 rounded text-[11px] font-medium transition ${filters.loaiCan === type ? 'border-[#c5a47e] bg-[#c5a47e]/10 text-[#c5a47e]' : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:border-[#c5a47e]'}`}>
                     {type}
                   </button>
                 ))}
              </div>
            </div>

            {/* Khoảng tầng */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Khoảng tầng</label>
              <select name="khoangTang" value={filters.khoangTang} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-[#c5a47e] outline-none">
                <option>Tất cả tầng</option>
                {['Tầng thấp', 'Tầng trung', 'Tầng cao'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Hướng ban công */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Hướng ban công</label>
              <select name="huongBanCong" value={filters.huongBanCong} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-[#c5a47e] outline-none">
                <option>Tất cả hướng</option>
                {['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Hiện trạng nội thất */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Hiện trạng nội thất</label>
              <select name="noiThat" value={filters.noiThat} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-[#c5a47e] outline-none">
                <option>Tất cả nội thất</option>
                {['Nguyên bản CĐT', 'Đồ cơ bản', 'Đầy đủ nội thất'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>

          </div>
        </aside>

        {/* DANH SÁCH SẢN PHẨM */}
        <section className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
             <div>
               <h3 className="text-xl font-bold text-gray-900 inline-block mr-2">{activeTab}</h3>
               <span className="text-[13px] font-normal text-gray-500 inline-block mt-1 sm:mt-0">Tìm thấy {filteredProperties.length} căn hộ phù hợp</span>
             </div>
          </div>

          {filteredProperties.length === 0 ? (
             <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                <p className="text-gray-500">Chưa có quỹ căn phù hợp với bộ lọc của bạn.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProperties.map(item => (
                <PropertyCard key={item.id} item={item} contactPhone={CONTACT_PHONE} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}