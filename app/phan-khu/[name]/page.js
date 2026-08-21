'use client';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const optimizeImg = (url) => url?.includes('cloudinary.com') ? url.replace('/upload/', '/upload/w_1000,c_limit,q_auto,f_auto/') : url;

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
  
  // STATE CHO TÍNH NĂNG VUỐT CẢM ỨNG TRÊN MOBILE
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

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

  // HÀM XỬ LÝ VUỐT ẢNH
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = (e) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && images.length > 1) {
      e.preventDefault(); e.stopPropagation();
      setCurrentImg(prev => prev < images.length - 1 ? prev + 1 : 0);
    }
    if (isRightSwipe && images.length > 1) {
      e.preventDefault(); e.stopPropagation();
      setCurrentImg(prev => prev > 0 ? prev - 1 : images.length - 1);
    }
  };

  return (
    <Link href={`/property/${item.id}`} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => {setIsHovering(false); setCurrentImg(0);}} className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col relative">
      <div 
        className="relative h-56 bg-gray-200 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {images.length > 0 ? (
          <img src={optimizeImg(images[currentImg])} loading="lazy" alt="Căn hộ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none" />
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
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 
  
  const CONTACT_PHONE = "0912791925";
  const scrollRef = useRef(null);

  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [isSendingFind, setIsSendingFind] = useState(false);
  const [findPhoneError, setFindPhoneError] = useState('');
  const [findData, setFindData] = useState({ nhuCau: 'Cho thuê', loaiCan: 'Studio', taiChinh: '', noiThat: 'Đầy đủ nội thất', ngayVaoO: '', soDienThoai: '', ghiChu: '', ten: '' });

  useEffect(() => {
    if (!exactName) return;
    document.title = `Phân khu ${exactName} - Vinhomes Smart City`;
    
    const fetchData = async () => {
      try {
        const pkDoc = await getDoc(doc(db, 'settings', 'phanKhuConfig'));
        if (pkDoc.exists() && pkDoc.data()[exactName]) {
          setPkConfig(pkDoc.data()[exactName]);
        }
        
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.seconds || 0 }));
        
        setProperties(data.filter(p => p.phanKhu === exactName));
        setLoading(false);
      } catch (error) { console.error("Lỗi:", error); setLoading(false); }
    };
    
    fetchData();
  }, [exactName]);

  useEffect(() => {
    if (pkConfig?.images?.length > 1) {
      const interval = setInterval(() => {
        if (scrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
            scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' }); 
          } else {
            scrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
          }
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [pkConfig?.images]);

  const filteredProperties = properties.filter(item => {
    return item.listingType === activeTab || (!item.listingType && activeTab === 'Cho thuê');
  }).sort((a, b) => {
    if (sortBy === 'priceAsc') return a.price - b.price;
    return b.createdAt - a.createdAt;
  });

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const currentProperties = filteredProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const scrollSlider = (direction) => {
    if (scrollRef.current) {
      if (direction === 'left') scrollRef.current.scrollBy({ left: -350, behavior: 'smooth' });
      else scrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  const checkSpam = () => {
    const lastSent = localStorage.getItem('lastFormSubmit');
    if (lastSent && Date.now() - parseInt(lastSent) < 60000) { alert('Vui lòng đợi 1 phút trước khi gửi yêu cầu tiếp theo!'); return false; }
    localStorage.setItem('lastFormSubmit', Date.now()); return true;
  };

  const handleFindSubmit = async (e) => {
    e.preventDefault();
    if (!checkSpam()) return;
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(findData.soDienThoai)) { setFindPhoneError("Số điện thoại không hợp lệ!"); return; }
    setIsSendingFind(true);

    try { await addDoc(collection(db, 'nho_tim_can'), { ...findData, source: `Trang Phân Khu ${exactName}`, createdAt: serverTimestamp(), status: 'Chưa xử lý' }); } catch(err) {}

    const BOT_TOKEN = "7295171731:AAEUgA3z1y3D6o_cK8t6W42aXfN-6I"; const CHAT_ID = "6190858172";
    if (BOT_TOKEN && CHAT_ID) {
      const message = `🚨 <b>KHÁCH TÌM CĂN MỚI!</b>\n\n👤 <b>Tên khách:</b> ${findData.ten || 'Chưa nhập'}\n📌 <b>Nhu cầu:</b> ${findData.nhuCau}\n🛏 <b>Loại căn:</b> ${findData.loaiCan}\n💰 <b>Tài chính:</b> ${findData.taiChinh}\n🛋 <b>Nội thất:</b> ${findData.noiThat}\n📅 <b>Vào ở:</b> ${findData.nhuCau === 'Cho thuê' ? findData.ngayVaoO || 'Chưa rõ' : 'N/A'}\n📞 <b>SĐT Khách:</b> <code>${findData.soDienThoai}</code>\n📝 <b>Yêu cầu thêm:</b> ${findData.ghiChu || 'Không có'}`;
      try { fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' }) }); } catch (error) {}
    }
    setIsSendingFind(false); setIsFindModalOpen(false);
    setFindData({ nhuCau: 'Cho thuê', loaiCan: 'Studio', taiChinh: '', noiThat: 'Đầy đủ nội thất', ngayVaoO: '', soDienThoai: '', ghiChu: '', ten: '' });
    alert("Đã gửi yêu cầu thành công! Chuyên viên An Ninh sẽ liên hệ Zalo anh/chị ngay nhé!");
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

      <section className="bg-blue-900 text-white py-16 px-4 md:px-12 text-center">
        <p className="text-sm font-bold text-blue-300 mb-2 uppercase tracking-[0.2em]">Vinhomes Smart City</p>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Phân khu {exactName}</h1>
      </section>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 w-full flex-grow">
        
        {pkConfig?.images?.length > 0 && (
          <div className="mb-12 relative group w-full overflow-hidden rounded-2xl shadow-lg border border-gray-100 bg-white p-2">
            <button onClick={() => scrollSlider('left')} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 text-blue-900 hover:bg-white font-bold text-xl backdrop-blur-sm transition opacity-0 group-hover:opacity-100">‹</button>
            <div ref={scrollRef} className="flex gap-2 overflow-x-auto snap-x relative scroll-smooth hide-scrollbar w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {pkConfig.images.map((img, i) => (
                <div key={i} className="w-[300px] md:w-[450px] h-[200px] md:h-[300px] flex-shrink-0 snap-center rounded-xl overflow-hidden">
                  <img src={img} className="w-full h-full object-cover hover:scale-105 transition duration-700" alt={`Cảnh quan ${exactName}`} />
                </div>
              ))}
            </div>
            <button onClick={() => scrollSlider('right')} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 text-blue-900 hover:bg-white font-bold text-xl backdrop-blur-sm transition opacity-0 group-hover:opacity-100">›</button>
          </div>
        )}

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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4 sm:border-0 sm:pb-0 border-gray-200">
           <div>
             <h2 className="text-2xl font-black text-blue-950 uppercase tracking-tight">Quỹ căn {exactName}</h2>
             <span className="text-sm font-medium text-gray-500 block mt-1">Đang có {filteredProperties.length} căn hộ</span>
           </div>
           
           <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex bg-gray-200/70 p-1 rounded-lg">
                 <button onClick={() => {setActiveTab('Cho thuê'); setCurrentPage(1);}} className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all ${activeTab === 'Cho thuê' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Cho thuê</button>
                 <button onClick={() => {setActiveTab('Chuyển nhượng'); setCurrentPage(1);}} className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all ${activeTab === 'Chuyển nhượng' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Bán</button>
              </div>
              <select value={sortBy} onChange={(e) => {setSortBy(e.target.value); setCurrentPage(1);}} className="text-sm border-gray-200 rounded-lg border py-2 px-3 text-gray-700 outline-none focus:border-blue-600 font-medium">
                <option value="newest">Mới nhất</option>
                <option value="priceAsc">Giá thấp nhất</option>
              </select>
           </div>
        </div>

        {loading ? (
           <div className="text-center py-20 font-bold text-gray-400">Đang tải quỹ căn...</div>
        ) : currentProperties.length === 0 ? (
           <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm"><p className="text-gray-500 font-medium">Chưa có quỹ căn phù hợp tại phân khu này.</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentProperties.map(item => <PropertyCard key={item.id} item={item} contactPhone={CONTACT_PHONE} />)}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4 mb-8">
                <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({top: 0, behavior: 'smooth'}); }} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition shadow-sm">‹</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => { setCurrentPage(i + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }} className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition shadow-sm ${currentPage === i + 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{i + 1}</button>
                ))}
                <button onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({top: 0, behavior: 'smooth'}); }} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition shadow-sm">›</button>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm mb-10 w-full mt-4">
              <div>
                  <h4 className="text-xl font-bold text-blue-900 mb-2">Không cần tự lướt hết quỹ căn</h4>
                  <p className="text-sm text-gray-600 font-medium">Gửi nhu cầu của bạn, chúng tôi sẽ chọn 3-5 căn phù hợp nhất để gửi lại bạn nhanh nhất.</p>
              </div>
              <button onClick={() => { setFindData({...findData, nhuCau: activeTab}); setIsFindModalOpen(true); }} className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-3.5 rounded-xl font-bold whitespace-nowrap transition shadow-lg shadow-blue-900/20 flex items-center gap-2 w-full md:w-auto justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Nhờ tìm căn phù hợp
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-12 px-4 md:px-12 w-full mt-auto">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-sm text-gray-600">
           <div className="md:pr-10">
             <div className="flex items-center mb-6"><img src="/logo.png" alt="Quỹ Căn Smart City Logo" className="h-10 md:h-12 w-auto object-contain" /></div>
             <p className="leading-relaxed font-medium mb-4">Quỹ Căn Smart City – Chuyên trang tổng hợp nguồn hàng mua bán, chuyển nhượng, cho thuê căn hộ tại Vinhomes Smart City Tây Mỗ. Cập nhật quỹ căn mới mỗi ngày tại mọi phân khu.</p>
             <p className="text-xs text-gray-400 font-medium">© 2026 Quỹ Căn Smart City.</p>
           </div>
           <div className="md:pl-10 md:border-l border-gray-100">
             <h3 className="font-extrabold text-blue-900 mb-5 text-lg uppercase tracking-wider">Liên hệ tư vấn</h3>
             <div className="space-y-4 font-medium text-[15px]">
               <p className="flex items-center gap-3">👤 <strong className="text-gray-800">Nguyễn An Ninh</strong></p>
               <p className="flex items-center gap-3">📞 <a href={`tel:${CONTACT_PHONE}`} className="font-bold text-blue-600 hover:text-blue-800 transition text-lg">{CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a> <span className="text-gray-400 text-xs ml-1">(SĐT / Zalo)</span></p>
               <p className="flex items-center gap-3">📍 Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội</p>
             </div>
           </div>
        </div>
      </footer>

      {isFindModalOpen && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-fade-in-up">
            <div className="bg-blue-900 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-10">
               <h3 className="text-lg font-bold flex items-center gap-2">🕵️ Nhờ tìm căn {exactName}</h3>
               <button onClick={() => setIsFindModalOpen(false)} className="text-blue-200 hover:text-white transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6 italic font-medium">Anh/chị chỉ cần để lại nhu cầu, chúng em sẽ lọc các căn đẹp nhất, giá tốt nhất và gửi qua Zalo ngay sau 5 phút!</p>
              <form onSubmit={handleFindSubmit} className="space-y-4 text-sm">
                 <div>
                   <label className="block font-bold text-gray-700 mb-1">Tên của anh/chị</label>
                   <input type="text" placeholder="Nhập tên..." value={findData.ten} onChange={(e)=>setFindData({...findData, ten: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 bg-gray-50 font-medium" />
                 </div>
                 <div className="flex gap-4">
                   <label className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2 cursor-pointer has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 transition">
                     <input type="radio" name="nhuCau" value="Cho thuê" checked={findData.nhuCau === 'Cho thuê'} onChange={(e)=>setFindData({...findData, nhuCau: e.target.value})} className="w-4 h-4 text-blue-600" />
                     <span className="font-bold text-gray-700">Tìm Thuê</span>
                   </label>
                   <label className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2 cursor-pointer has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 transition">
                     <input type="radio" name="nhuCau" value="Chuyển nhượng" checked={findData.nhuCau === 'Chuyển nhượng'} onChange={(e)=>setFindData({...findData, nhuCau: e.target.value})} className="w-4 h-4 text-blue-600" />
                     <span className="font-bold text-gray-700">Tìm Mua</span>
                   </label>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block font-bold text-gray-700 mb-1">Loại căn *</label>
                     <select required value={findData.loaiCan} onChange={(e)=>setFindData({...findData, loaiCan: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 bg-white font-medium">
                        {['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(opt => <option key={opt}>{opt}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block font-bold text-gray-700 mb-1">Tầm tài chính *</label>
                     <input required type="text" placeholder={findData.nhuCau === 'Cho thuê' ? "VD: 8-10 triệu" : "VD: Dưới 3 tỷ"} value={findData.taiChinh} onChange={(e)=>setFindData({...findData, taiChinh: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 bg-gray-50 font-medium" />
                   </div>
                   <div className="col-span-2 sm:col-span-1">
                     <label className="block font-bold text-gray-700 mb-1">Mức độ nội thất *</label>
                     <select required value={findData.noiThat} onChange={(e)=>setFindData({...findData, noiThat: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 bg-white font-medium">
                        {['Nguyên bản CĐT', 'Đồ cơ bản', 'Đầy đủ nội thất'].map(opt => <option key={opt}>{opt}</option>)}
                     </select>
                   </div>
                   {findData.nhuCau === 'Cho thuê' ? (
                     <div className="col-span-2 sm:col-span-1">
                       <label className="block font-bold text-gray-700 mb-1">Thời gian cần ở</label>
                       <input type="date" value={findData.ngayVaoO} onChange={(e)=>setFindData({...findData, ngayVaoO: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 bg-white font-medium" />
                     </div>
                   ) : <div className="hidden"></div>}
                 </div>
                 
                 <div>
                   <label className="block font-bold text-gray-700 mb-1">Số điện thoại / Zalo *</label>
                   <input required type="tel" placeholder="09xxxx..." value={findData.soDienThoai} onChange={(e)=>{setFindData({...findData, soDienThoai: e.target.value}); setFindPhoneError('');}} className={`w-full p-3 border rounded-lg outline-none transition font-medium ${findPhoneError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-600 bg-gray-50'}`} />
                   {findPhoneError && <p className="text-red-500 text-xs font-bold mt-1">{findPhoneError}</p>}
                 </div>
                 <div>
                   <label className="block font-bold text-gray-700 mb-1">Yêu cầu thêm</label>
                   <textarea rows="2" placeholder={`VD: Cần tìm căn bên khu ${exactName} giá tốt nhất...`} value={findData.ghiChu} onChange={(e)=>setFindData({...findData, ghiChu: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 bg-gray-50 font-medium"></textarea>
                 </div>
                 <button type="submit" disabled={isSendingFind} className="w-full bg-blue-700 hover:bg-blue-800 text-white p-3.5 rounded-lg font-bold text-base transition shadow-md disabled:bg-gray-400 flex items-center justify-center gap-2 mt-2">
                   {isSendingFind ? 'Đang gửi...' : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg> Gửi yêu cầu & Nhận báo giá</>}
                 </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-3 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <a href={`tel:${CONTACT_PHONE}`} className="flex-1 bg-blue-600 text-white flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold text-sm shadow-md">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
           Gọi ngay
        </a>
        <a href={`https://zalo.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Xin chào, tôi quan tâm các căn trên web.`)}`} target="_blank" rel="noreferrer" className="flex-1 bg-blue-50 border border-blue-200 text-blue-800 flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold text-sm">
           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.2-.6-2.4-.6-3.6 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1zM19 12h2a9 9 0 00-9-9v2c3.9 0 7.1 3.2 7.1 7.1zM15 12h2c0-2.8-2.2-5-5-5v2c1.7 0 3 1.3 3 3z"/></svg>
           Nhắn Zalo
        </a>
      </div>

      <style jsx global>{`
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}