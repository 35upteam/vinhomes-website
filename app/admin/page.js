'use client';
import { useEffect, useState } from 'react';
import { db } from '../../firebase-config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Số điện thoại mặc định
  const CONTACT_PHONE = "0912791925";
  const CONTACT_PHONE_DISPLAY = "0912.791.925";

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

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#f9f7f3]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b8955a]"></div></div>;

  return (
    <div className="min-h-screen bg-[#f9f7f3] text-gray-800 font-sans">
      
      {/* 1. HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-50 px-4 md:px-12 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 border-2 border-[#b8955a] text-[#b8955a] flex items-center justify-center font-serif font-bold text-xl">V</div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight uppercase tracking-wide">Vinhomes Lifestyle</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Căn hộ chuyển nhượng & cho thuê</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <a href={`tel:${CONTACT_PHONE}`} className="flex items-center gap-2 bg-[#b8955a] text-white px-5 py-2 rounded font-medium hover:bg-[#a07d46] transition text-sm shadow-md">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
             Liên hệ
           </a>
        </div>
      </header>

      {/* 2. HERO BANNER */}
      <section className="relative bg-gray-900 text-white h-[300px] flex items-center px-4 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="relative z-10 max-w-4xl">
          <p className="text-sm font-medium text-gray-300 mb-2 uppercase tracking-widest">Vinhomes Smart City</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Căn hộ chuyển nhượng<br/>& cho thuê</h2>
          <p className="text-sm md:text-base text-gray-300 max-w-xl">Bảng hàng cập nhật theo giờ — chọn căn đúng nhu cầu tại Vinhomes Smart City.</p>
        </div>
      </section>

      {/* 3. MAIN CONTENT (2 COLUMNS) */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR BỘ LỌC */}
        <aside className="w-full md:w-[280px] flex-shrink-0">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Bộ lọc</h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Tìm kiếm</label>
                <div className="relative">
                  <input type="text" placeholder="Mã căn, tòa nhà..." className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-[#b8955a] focus:border-[#b8955a] outline-none" />
                  <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Tòa nhà</label>
                <select className="w-full p-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-[#b8955a] outline-none text-gray-700">
                  <option>Tất cả tòa</option><option>Sola Park</option><option>Imperia</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Loại căn</label>
                <div className="grid grid-cols-2 gap-2">
                   {['Studio', '1N', '1N+', '2N1WC', '2N+', '3N'].map(type => (
                     <button key={type} className="border border-gray-200 py-1.5 rounded text-xs font-medium text-gray-600 hover:border-[#b8955a] hover:text-[#b8955a] transition">{type}</button>
                   ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Khoảng giá</label>
                  <input type="number" placeholder="Từ" className="w-full p-2 border border-gray-200 rounded text-sm mb-2" />
                  <input type="number" placeholder="Đến" className="w-full p-2 border border-gray-200 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Diện tích</label>
                  <input type="number" placeholder="Từ" className="w-full p-2 border border-gray-200 rounded text-sm mb-2" />
                  <input type="number" placeholder="Đến" className="w-full p-2 border border-gray-200 rounded text-sm" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* DANH SÁCH SẢN PHẨM */}
        <section className="flex-1">
          {/* Header kết quả */}
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-bold text-gray-900">Cho thuê <span className="text-sm font-normal text-gray-500 block sm:inline mt-1 sm:mt-0 sm:ml-2">Tìm thấy {properties.length} căn hộ</span></h3>
             <div className="flex items-center gap-3">
               <select className="text-sm border-gray-200 rounded border p-1.5 text-gray-600 focus:outline-none">
                 <option>Mới nhất</option>
                 <option>Giá thấp - cao</option>
               </select>
             </div>
          </div>

          {/* Grid Thẻ căn hộ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                 {/* Ảnh */}
                 <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt="Căn hộ" className="w-full h-full object-cover" />
                    ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">Chưa có ảnh</div>}
                    
                    {/* Badges trên ảnh */}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-gray-800">{item.type}</div>
                    <div className="absolute top-2 right-2 bg-black/50 text-white px-1.5 py-0.5 rounded text-[10px]">{item.images?.length || 0}/10</div>
                 </div>

                 {/* Thông tin */}
                 <div className="p-4">
                    <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase">MÃ CĂN: {item.maCan || 'N/A'}</p>
                    <p className="text-xs text-[#b8955a] font-medium mb-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                      Tòa {item.building} - Tầng {item.floor}
                    </p>
                    
                    <h3 className="font-bold text-sm text-gray-900 mb-3 h-10 overflow-hidden line-clamp-2">
                      Thuê căn hộ {item.type} {item.area}m² tòa {item.building}
                    </h3>
                    
                    {/* Grid Specs */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-[11px] text-gray-600 mb-4">
                      <div className="flex items-center gap-1"><span className="text-gray-400">🛏️</span> {item.type}</div>
                      <div className="flex items-center gap-1"><span className="text-gray-400">📐</span> {item.area} m²</div>
                    </div>

                    <div className="text-lg font-extrabold text-gray-900 mb-4">
                      {item.price} <span className="text-sm font-normal text-gray-500">triệu/tháng</span>
                    </div>

                    {/* Nút Call to Action */}
                    <div className="flex gap-2">
                      <a href={`tel:${CONTACT_PHONE}`} className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 text-center py-2 rounded text-sm font-semibold transition flex justify-center items-center gap-1">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                         Liên hệ
                      </a>
                      <a href={`https://zalo.me/${CONTACT_PHONE}`} target="_blank" rel="noreferrer" className="flex-1 bg-[#b8955a] hover:bg-[#a07d46] text-white text-center py-2 rounded text-sm font-semibold transition flex justify-center items-center gap-1">
                         Zalo
                      </a>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-8 px-4 md:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between gap-6 text-sm text-gray-500">
           <div className="max-w-md">
             <div className="flex items-center gap-2 mb-3">
               <div className="w-8 h-8 border-2 border-[#b8955a] text-[#b8955a] flex items-center justify-center font-serif font-bold text-lg">V</div>
               <span className="font-bold text-gray-800 tracking-wide">VINHOMES LIFESTYLE</span>
             </div>
             <p className="text-xs leading-relaxed">Cổng thông tin dữ liệu về căn hộ chuyển nhượng, cho thuê và đời sống cư dân. Không phải website của chủ đầu tư.</p>
           </div>
           <div>
             <p className="font-bold text-gray-800 mb-2">Liên hệ</p>
             <p className="mb-1">Hotline/Zalo: <a href={`tel:${CONTACT_PHONE}`} className="text-[#b8955a]">{CONTACT_PHONE_DISPLAY}</a></p>
             <p>Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội</p>
           </div>
        </div>
      </footer>
    </div>
  );
}
