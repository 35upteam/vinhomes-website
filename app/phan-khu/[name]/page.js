'use client';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const optimizeImg = (url) => url?.includes('cloudinary.com') ? url.replace('/upload/', '/upload/w_1000,c_limit,q_auto,f_auto/') : url;

// HÀM DỊCH NGƯỢC URL VỀ TÊN PHÂN KHU GỐC TRONG DATABASE
const decodePK = (slug) => {
  const map = {
    'sapphire': 'Sapphire', 'miami': 'Miami', 'sakura': 'Sakura', 'victoria': 'Victoria',
    'imperia': 'Imperia', 'sola-park': 'Sola Park', 'tonkin': 'Tonkin',
    'canopy': 'Canopy', 'masteri-west-height': 'Masteri West Height', 'lumiere-evergreen': 'Lumiere Evergreen'
  };
  return map[slug] || '';
};

const PropertyCard = ({ item, contactPhone }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const images = item.images && item.images.length > 0 ? item.images : [];
  
  useEffect(() => {
    let timer;
    if (isHovering && images.length > 1) {
      timer = setInterval(() => setCurrentImg(prev => (prev + 1) % images.length), 1200);
    }
    return () => clearInterval(timer);
  }, [isHovering, images.length]);

  const nextImg = (e) => { e.preventDefault(); e.stopPropagation(); if (currentImg < images.length - 1) setCurrentImg(currentImg + 1); else setCurrentImg(0); };
  const prevImg = (e) => { e.preventDefault(); e.stopPropagation(); if (currentImg > 0) setCurrentImg(currentImg - 1); else setCurrentImg(images.length - 1); };

  const handleCopy = (e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(item.maCan); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <Link href={`/property/${item.id}`} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => {setIsHovering(false); setCurrentImg(0);}} className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col relative">
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        {images.length > 0 ? (
          <img src={optimizeImg(images[currentImg])} loading="lazy" alt="Căn hộ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">Chưa có ảnh</div>}
        
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 backdrop-blur-sm">‹</button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 backdrop-blur-sm">›</button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">{images.map((_, idx) => (<div key={idx} className={`h-1.5 rounded-full transition-all ${currentImg === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}></div>))}</div>
          </>
        )}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-md text-[10px] font-extrabold text-blue-900 uppercase shadow-sm z-10">{item.loaiCan || item.type}</div>
        {item.nhanDan && item.nhanDan !== 'Không có' && (<div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase shadow-lg z-10 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 12a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0zM21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9 9-4.03 9-9zm-9-7.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm1 11.5h-2v-2h2v2zm0-3.5h-2v-5h2v5z"></path></svg>{item.nhanDan}</div>)}
        <div className="absolute bottom-3 right-3 bg-white/60 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-2 z-10 text-gray-800 shadow-sm border border-white/40"><span className="text-[10px] font-bold tracking-wide">Mã căn: {item.maCan}</span><button onClick={handleCopy} className="text-gray-600 hover:text-blue-700 transition relative"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>{copied && <span className="absolute -top-7 -right-2 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded shadow whitespace-nowrap">Đã copy!</span>}</button></div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-blue-950 text-lg uppercase tracking-tight group-hover:text-blue-600 transition-colors mb-4 line-clamp-2 leading-snug text-center">{item.phanKhu} - Tòa {item.toaNha || item.building}</h3>
        <div className="grid grid-cols-2 gap-2 mb-6">
          <span className="bg-gray-50 border border-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-md font-medium truncate">🏢 {item.khoangTang || 'Đang cập nhật'}</span>
          <span className="bg-gray-50 border border-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-md font-medium truncate">📐 {item.area} m²</span>
          <span className="bg-gray-50 border border-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-md font-medium truncate">🧭 {item.huongBanCong || 'Đang cập nhật'}</span>
          <span className="bg-gray-50 border border-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-md font-medium truncate">🛋️ {item.noiThat || 'Đang cập nhật'}</span>
        </div>
        <div className="mt-auto border-t border-gray-100 pt-5">
          <div className="mb-4 flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-blue-700">{item.price}</span>
              <span className="text-sm font-bold text-blue-700/80">{item.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'Triệu/tháng'}</span>
            </div>
          </div>
          <object><a href={`https://zalo.me/${contactPhone}?text=${encodeURIComponent(`Xin chào, tôi muốn nhờ tư vấn căn hộ Mã ${item.maCan} trên web.`)}`} target="_blank" rel="noreferrer" onClick={(e)=>e.stopPropagation()} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white text-center py-3 rounded-xl font-bold transition shadow-md shadow-blue-600/20 flex justify-center items-center gap-2">Nhận tư vấn căn này</a></object>
        </div>
      </div>
    </Link>
  );
};

export default function SubdivisionLandingPage() {
  const { name } = useParams();
  const exactName = decodePK(name);
  
  const [pkConfig, setPkConfig] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('Cho thuê');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(9);
  
  const CONTACT_PHONE = "0912791925";
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!exactName) return;
    document.title = `Phân khu ${exactName} - Vinhomes Smart City`;
    
    const fetchData = async () => {
      try {
        // Tải cấu hình phân khu
        const pkDoc = await getDoc(doc(db, 'settings', 'phanKhuConfig'));
        if (pkDoc.exists() && pkDoc.data()[exactName]) {
          setPkConfig(pkDoc.data()[exactName]);
        }
        
        // Tải rổ hàng phân khu
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.seconds || 0 }));
        
        // Chỉ lấy căn thuộc phân khu này
        setProperties(data.filter(p => p.phanKhu === exactName));
        setLoading(false);
      } catch (error) { console.error("Lỗi:", error); setLoading(false); }
    };
    
    fetchData();
  }, [exactName]);

  const filteredProperties = properties.filter(item => {
    return item.listingType === activeTab || (!item.listingType && activeTab === 'Cho thuê');
  }).sort((a, b) => {
    if (sortBy === 'priceAsc') return a.price - b.price;
    return b.createdAt - a.createdAt;
  });

  const currentProperties = filteredProperties.slice(0, visibleCount);

  const scrollSlider = (direction) => {
    if (scrollRef.current) {
      if (direction === 'left') scrollRef.current.scrollBy({ left: -350, behavior: 'smooth' });
      else scrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  if (!exactName) return <div className="text-center py-20 font-bold">Không tìm thấy phân khu!</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col relative pb-20 md:pb-0">
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center hover:opacity-80 transition"><img src="/logo.png" alt="Quỹ Căn Smart City" className="h-10 md:h-12 w-auto object-contain" /></Link>
        <div className="flex items-center gap-3 md:gap-4">
           <a href={`https://zalo.me/${CONTACT_PHONE}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-5 py-2 rounded-full font-bold hover:opacity-90 transition shadow-md text-sm"><span className="hidden sm:inline">Liên hệ tư vấn</span><span className="sm:hidden">Liên hệ</span></a>
        </div>
      </header>

      {/* HEADER PHÂN KHU */}
      <section className="bg-blue-900 text-white py-16 px-4 md:px-12 text-center">
        <p className="text-sm font-bold text-blue-300 mb-2 uppercase tracking-[0.2em]">Vinhomes Smart City</p>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Phân khu {exactName}</h1>
      </section>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 w-full flex-grow">
        
        {/* SLIDER ẢNH PHÂN KHU NẾU CÓ */}
        {pkConfig?.images?.length > 0 && (
          <div className="mb-12 relative group w-full overflow-hidden rounded-2xl shadow-lg border border-gray-100 bg-white p-2">
            <button onClick={() => scrollSlider('left')} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 text-blue-900 hover:bg-white font-bold text-xl backdrop-blur-sm transition">‹</button>
            <div ref={scrollRef} className="flex gap-2 overflow-x-auto snap-x relative scroll-smooth hide-scrollbar w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {pkConfig.images.map((img, i) => (
                <div key={i} className="w-[300px] md:w-[450px] h-[200px] md:h-[300px] flex-shrink-0 snap-center rounded-xl overflow-hidden">
                  <img src={img} className="w-full h-full object-cover hover:scale-105 transition duration-700" alt={`Cảnh quan ${exactName}`} />
                </div>
              ))}
            </div>
            <button onClick={() => scrollSlider('right')} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 text-blue-900 hover:bg-white font-bold text-xl backdrop-blur-sm transition">›</button>
          </div>
        )}

        {/* THÔNG TIN TỔNG QUAN */}
        {pkConfig && (pkConfig.tongQuan || pkConfig.uuDiem || pkConfig.tienIch) && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-blue-900 mb-4 border-b border-gray-100 pb-3"><span className="text-2xl">🌟</span> Tổng quan & Điểm nhấn</h3>
                {pkConfig.tongQuan && <p className="text-gray-700 leading-relaxed mb-6 font-medium text-justify">{pkConfig.tongQuan}</p>}
                
                {pkConfig.uuDiem && (
                  <ul className="space-y-3">
                    {pkConfig.uuDiem.split(';').filter(Boolean).map((line, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-800 font-bold">
                         <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                         {line.trim()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-blue-900 mb-4 border-b border-gray-100 pb-3"><span className="text-2xl">🏖️</span> Hệ thống Tiện ích</h3>
                {pkConfig.tienIch ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pkConfig.tienIch.split(';').filter(Boolean).map((line, i) => (
                      <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-2 text-sm text-blue-900 font-bold">
                         <span className="text-blue-500">✔</span> {line.trim()}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-400 italic text-sm">Đang cập nhật...</p>}
              </div>

            </div>
          </div>
        )}

        <hr className="border-gray-200 mb-10" />

        {/* BỘ LỌC VÀ RỔ HÀNG RIÊNG CỦA PHÂN KHU NÀY */}
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-6 gap-4">
           <div>
             <h2 className="text-2xl font-black text-blue-950 uppercase tracking-tight">Rổ hàng {exactName}</h2>
             <span className="text-sm font-medium text-gray-500 block mt-1">Đang có {filteredProperties.length} căn hộ</span>
           </div>
           
           <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex bg-gray-200/70 p-1 rounded-lg">
                 <button onClick={() => setActiveTab('Cho thuê')} className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all ${activeTab === 'Cho thuê' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Cho thuê</button>
                 <button onClick={() => setActiveTab('Chuyển nhượng')} className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all ${activeTab === 'Chuyển nhượng' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Bán</button>
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm border-gray-200 rounded-lg border py-2 px-3 text-gray-700 outline-none focus:border-blue-600 font-medium">
                <option value="newest">Mới nhất</option>
                <option value="priceAsc">Giá thấp nhất</option>
              </select>
           </div>
        </div>

        {loading ? (
           <div className="text-center py-20 font-bold text-gray-400">Đang tải rổ hàng...</div>
        ) : currentProperties.length === 0 ? (
           <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm"><p className="text-gray-500 font-medium">Chưa có quỹ căn phù hợp tại phân khu này.</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentProperties.map(item => <PropertyCard key={item.id} item={item} contactPhone={CONTACT_PHONE} />)}
            </div>
            
            {visibleCount < filteredProperties.length && (
              <div className="flex justify-center mb-8">
                <button onClick={() => setVisibleCount(prev => prev + 9)} className="bg-white border-2 border-blue-600 text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-full font-bold transition shadow-sm">
                  Xem thêm {filteredProperties.length - visibleCount} căn nữa...
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 px-4 text-center text-sm text-gray-500">
         © 2026 Quỹ Căn Smart City. All rights reserved.
      </footer>
    </div>
  );
}