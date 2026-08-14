'use client';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// Component riêng cho Thẻ Căn Hộ (để xử lý chức năng trượt ảnh)
const PropertyCard = ({ item, contactPhone }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const images = item.images && item.images.length > 0 ? item.images : [];
  
  const nextImg = (e) => {
    e.preventDefault();
    if (currentImg < images.length - 1) setCurrentImg(currentImg + 1);
  };
  
  const prevImg = (e) => {
    e.preventDefault();
    if (currentImg > 0) setCurrentImg(currentImg - 1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col">
      {/* Khối Ảnh */}
      <div className="relative h-56 bg-gray-200 group overflow-hidden">
        {images.length > 0 ? (
          <img src={images[currentImg]} alt="Căn hộ" className="w-full h-full object-cover transition-transform duration-300" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Chưa có ảnh</div>
        )}
        
        {/* Nút chuyển ảnh (chỉ hiện khi hover) */}
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">‹</button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">›</button>
            
            {/* Chấm tròn chỉ thị ảnh */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all ${currentImg === idx ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`}></div>
              ))}
            </div>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-800 uppercase shadow-sm">
          {item.type.replace(' Phòng ngủ', 'N')}
        </div>
        <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-md text-[10px] font-medium">
          {images.length > 0 ? `${currentImg + 1}/${images.length}` : '0/0'}
        </div>
      </div>

      {/* Khối Thông tin */}
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">MÃ CĂN: {item.maCan || 'ĐANG CẬP NHẬT'}</p>
        <p className="text-xs text-[#a07d46] font-medium mb-2 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
          Tòa {item.building} - {item.floor}
        </p>
        
        <h3 className="font-bold text-sm text-gray-900 mb-3 leading-snug h-10 overflow-hidden line-clamp-2">
          Thuê căn hộ {item.type} {item.area}m² tòa {item.building}
        </h3>
        
        {/* Lưới thông số (Mockup thêm dữ liệu cho giống UI thật) */}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-[11px] text-gray-600 mb-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🛏️</span> {item.type}</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">📐</span> {item.area} m²</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🧭</span> Đông Nam</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🛋️</span> Full đồ</div>
          <div className="col-span-2 flex items-center gap-1.5"><span className="text-gray-400">💰</span> Phí DV: Đã bao gồm</div>
        </div>

        {/* Giá và Nút */}
        <div className="mt-auto">
          <div className="text-xl font-extrabold text-gray-900 mb-4">
            {item.price} <span className="text-xs font-medium text-gray-500">triệu/tháng</span>
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
  const [activeTab, setActiveTab] = useState('rent'); // 'rent' or 'sale'

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

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#fbfaf7]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c5a47e]"></div></div>;

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-gray-800 font-sans selection:bg-[#c5a47e] selection:text-white">
      
      {/* HEADER */}
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-[#c5a47e] text-[#c5a47e] flex items-center justify-center font-serif font-medium text-lg">V</div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none uppercase tracking-widest mb-1">Vinhomes Lifestyle</h1>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest">Căn hộ chuyển nhượng & cho thuê</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button className="text-gray-400 hover:text-gray-600">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
           </button>
           <a href={`tel:${CONTACT_PHONE}`} className="bg-[#c5a47e] text-white px-6 py-2 rounded-md font-semibold hover:bg-[#b08d66] transition text-sm shadow-md flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
             Liên hệ
           </a>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="relative bg-gray-900 text-white py-20 px-4 md:px-12 flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a202c] via-[#1a202c]/80 to-transparent"></div>
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <p className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-[0.2em]">Vinhomes Smart City</p>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-[1.15] tracking-tight">Căn hộ chuyển nhượng<br/>& cho thuê</h2>
          <p className="text-sm md:text-base text-gray-300 max-w-lg font-light leading-relaxed">Bảng hàng cập nhật theo giờ — chọn căn đúng nhu cầu tại Vinhomes Smart City.</p>
        </div>
      </section>

      {/* TABS */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex gap-2 border-b border-gray-200">
           <button onClick={() => setActiveTab('rent')} className={`py-3 px-6 text-sm font-semibold transition relative ${activeTab === 'rent' ? 'text-[#c5a47e]' : 'text-gray-500 hover:text-gray-800'}`}>
             Cho thuê ({properties.length})
             {activeTab === 'rent' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#c5a47e]"></div>}
           </button>
           <button onClick={() => setActiveTab('sale')} className={`py-3 px-6 text-sm font-semibold transition relative ${activeTab === 'sale' ? 'text-[#c5a47e]' : 'text-gray-500 hover:text-gray-800'}`}>
             Chuyển nhượng (0)
             {activeTab === 'sale' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#c5a47e]"></div>}
           </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR BỘ LỌC */}
        <aside className="w-full lg:w-[280px] flex-shrink-0 bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24">
          <h3 className="font-bold text-lg mb-6 text-gray-900">Bộ lọc</h3>
          
          <div className="space-y-6">
            {/* Tìm kiếm */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Tìm kiếm</label>
              <div className="relative">
                <input type="text" placeholder="Mã căn, tòa nhà..." className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:border-[#c5a47e] outline-none transition placeholder-gray-400" />
                <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>

            {/* Dropdowns cơ bản */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Tòa nhà</label>
              <select className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-[#c5a47e] outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center]">
                <option>Tất cả tòa</option><option>Sola Park</option><option>Imperia Smart City</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Nhóm tầng</label>
              <select className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-[#c5a47e] outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center]">
                <option>Tất cả tầng</option><option>Thấp</option><option>Trung</option><option>Cao</option>
              </select>
            </div>

            {/* Grid Nút Loại Căn */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Loại căn</label>
              <div className="grid grid-cols-2 gap-2">
                 {['Studio', '1N', '1N+', '2N1WC', '2N+', '3N'].map(type => (
                   <button key={type} className="border border-gray-200 bg-gray-50/50 py-1.5 rounded text-[11px] font-medium text-gray-600 hover:border-[#c5a47e] hover:text-[#c5a47e] transition">{type}</button>
                 ))}
              </div>
            </div>

            {/* Input Khoảng */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Khoảng giá</label>
                <input type="number" placeholder="Từ" className="w-full p-2 border border-gray-200 rounded-md text-sm mb-2 focus:border-[#c5a47e] outline-none placeholder-gray-400" />
                <input type="number" placeholder="Đến" className="w-full p-2 border border-gray-200 rounded-md text-sm focus:border-[#c5a47e] outline-none placeholder-gray-400" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Diện tích (m²)</label>
                <input type="number" placeholder="Từ" className="w-full p-2 border border-gray-200 rounded-md text-sm mb-2 focus:border-[#c5a47e] outline-none placeholder-gray-400" />
                <input type="number" placeholder="Đến" className="w-full p-2 border border-gray-200 rounded-md text-sm focus:border-[#c5a47e] outline-none placeholder-gray-400" />
              </div>
            </div>

            {/* Dropdowns nâng cao */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Hướng ban công</label>
              <select className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-[#c5a47e] outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center]">
                <option>Tất cả hướng</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Hiện trạng nội thất</label>
              <select className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-[#c5a47e] outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center]">
                <option>Tất cả</option>
              </select>
            </div>
          </div>
        </aside>

        {/* DANH SÁCH SẢN PHẨM */}
        <section className="flex-1 w-full">
          {/* Header kết quả */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
             <div>
               <h3 className="text-xl font-bold text-gray-900 inline-block mr-2">{activeTab === 'rent' ? 'Cho thuê' : 'Chuyển nhượng'}</h3>
               <span className="text-[13px] font-normal text-gray-500 inline-block mt-1 sm:mt-0">Tìm thấy {properties.length} căn hộ</span>
             </div>
             
             <div className="flex items-center gap-3 w-full sm:w-auto">
               <div className="flex items-center text-xs text-gray-500 mr-2 whitespace-nowrap">
                 Hiển thị <span className="font-bold text-gray-800 mx-1">1 - {properties.length}</span> / {properties.length} căn - Trang <span className="font-bold text-gray-800 mx-1">1/1</span>
               </div>
               <select className="text-sm border-gray-200 rounded border py-1.5 px-3 text-gray-600 focus:outline-none bg-white">
                 <option>Mới nhất</option>
                 <option>Giá thấp - cao</option>
               </select>
               <div className="flex bg-gray-100 rounded p-0.5 border border-gray-200 hidden sm:flex">
                 <button className="bg-[#a07d46] text-white px-3 py-1 rounded text-xs font-semibold shadow-sm">Lưới</button>
                 <button className="text-gray-500 px-3 py-1 rounded text-xs font-medium hover:text-gray-700">List</button>
               </div>
             </div>
          </div>

          {/* Grid Thẻ căn hộ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {properties.map(item => (
              <PropertyCard key={item.id} item={item} contactPhone={CONTACT_PHONE} />
            ))}
          </div>

          {/* Phân trang (Mockup) */}
          {properties.length > 0 && (
            <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200 text-sm">
               <div className="text-gray-500 hidden sm:block text-xs">
                 Hiển thị <span className="font-bold text-gray-800">1 - {properties.length}</span> / {properties.length} căn - Trang <span className="font-bold text-gray-800">1/1</span>
               </div>
               <div className="flex gap-1 mx-auto sm:mx-0">
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 bg-white" disabled>‹</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-[#a07d46] bg-[#a07d46] text-white font-medium">1</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 bg-white" disabled>›</button>
               </div>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-10 px-4 md:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between gap-8 text-sm text-gray-500">
           <div className="max-w-md">
             <div className="flex items-center gap-2 mb-4">
               <div className="w-8 h-8 border border-[#c5a47e] text-[#c5a47e] flex items-center justify-center font-serif font-medium text-lg">V</div>
               <span className="font-bold text-gray-800 tracking-widest uppercase text-xs">VINHOMES LIFESTYLE</span>
             </div>
             <p className="text-xs leading-relaxed font-light">Cổng thông tin dữ liệu về căn hộ chuyển nhượng, cho thuê và đời sống cư dân. Không phải website của chủ đầu tư.</p>
           </div>
           <div>
             <p className="font-bold text-gray-800 mb-3 text-xs uppercase tracking-wider">Liên hệ</p>
             <p className="mb-1.5 font-light">Hotline: <a href={`tel:${CONTACT_PHONE}`} className="text-gray-600 font-medium hover:text-[#c5a47e]">{CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a></p>
             <p className="mb-1.5 font-light">Zalo: <a href={`https://zalo.me/${CONTACT_PHONE}`} className="text-gray-600 font-medium hover:text-[#c5a47e]">{CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a></p>
             <p className="font-light">Đại lộ Thăng Long, Nam Từ Liêm, Hà Nội</p>
           </div>
        </div>
      </footer>
    </div>
  );
}