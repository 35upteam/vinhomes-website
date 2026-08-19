'use client';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp, where, limit } from 'firebase/firestore';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const optimizeImg = (url) => url?.includes('cloudinary.com') ? url.replace('/upload/', '/upload/w_1000,c_limit,q_auto,f_auto/') : url;

// HÀM CHUYỂN TÊN PHÂN KHU THÀNH ĐƯỜNG LINK (Ví dụ: "Sola Park" -> "sola-park")
const slugify = (text) => {
  if(!text) return '';
  return text.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
};

const SkeletonDetail = () => (
  <div className="animate-pulse w-full flex flex-col lg:flex-row gap-8">
    <div className="flex-1 w-full">
      <div className="h-[400px] md:h-[500px] bg-gray-200 rounded-2xl mb-8"></div>
      <div className="h-10 bg-gray-200 w-3/4 rounded mb-4"></div>
      <div className="h-12 bg-gray-200 w-1/3 rounded mb-8"></div>
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm h-64 mb-8"></div>
    </div>
    <aside className="w-full lg:w-[320px] flex-shrink-0">
      <div className="h-[400px] bg-gray-200 rounded-2xl"></div>
    </aside>
  </div>
);

const MiniPropertyCard = ({ item }) => {
  const images = item.images && item.images.length > 0 ? item.images : [];
  return (
    <Link href={`/property/${item.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition w-[260px] max-w-[80vw] snap-start flex-shrink-0 relative">
      <div className="h-40 bg-gray-200 relative">
        {images.length > 0 ? (
          <img src={optimizeImg(images[0])} loading="lazy" alt="Căn hộ" className="w-full h-full object-cover" />
        ) : <div className="flex items-center justify-center h-full text-gray-400 text-xs">Chưa có ảnh</div>}
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-[9px] font-bold text-blue-900 uppercase">{item.loaiCan || item.type}</div>
        {item.nhanDan && item.nhanDan !== 'Không có' && <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-[8px] font-black uppercase shadow">{item.nhanDan}</div>}
      </div>
      <div className="p-4">
        <p className="text-[9px] text-gray-400 font-semibold mb-1 uppercase">MÃ: {item.maCan}</p>
        <h4 className="font-bold text-blue-950 text-sm truncate mb-2 text-center">{item.phanKhu} - Tòa {item.toaNha || item.building}</h4>
        <div className="flex justify-center items-baseline gap-1">
          <span className="text-lg font-black text-blue-700">{item.price}</span>
          <span className="text-[10px] font-bold text-blue-700/80">{item.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'Tr/tháng'}</span>
        </div>
      </div>
    </Link>
  );
};

export default function PropertyDetail() {
  const { id } = useParams();
  const scrollRef = useRef(null);
  const [property, setProperty] = useState(null);
  const [similarProps, setSimilarProps] = useState([]);
  
  const [pkConfig, setPkConfig] = useState({ phi: 'Đang cập nhật', tongQuan: '', uuDiem: '', tienIch: '' });
  const [loading, setLoading] = useState(true);
  
  const [currentImg, setCurrentImg] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(0);
  const [copied, setCopied] = useState(false);

  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [isSendingFind, setIsSendingFind] = useState(false);
  const [findPhoneError, setFindPhoneError] = useState('');
  const [findData, setFindData] = useState({ nhuCau: 'Cho thuê', loaiCan: 'Studio', taiChinh: '', noiThat: 'Đầy đủ nội thất', ngayVaoO: '', soDienThoai: '', ghiChu: '', ten: '' });

  const CONTACT_PHONE = "0912791925";

  const clearFilterCacheAndReset = () => {
    sessionStorage.removeItem('savedActiveTab');
    sessionStorage.removeItem('savedFilters');
    sessionStorage.removeItem('savedCurrentPage');
    sessionStorage.removeItem('savedSortBy');
  };

  useEffect(() => {
    const fetchData = async () => {
      let foundInCache = false;

      const cachedStr = sessionStorage.getItem('cachedProperties');
      if (cachedStr) {
        try {
          const cachedProps = JSON.parse(cachedStr);
          const cachedProp = cachedProps.find(p => p.id === id);
          if (cachedProp) {
            setProperty(cachedProp);
            document.title = `[${cachedProp.listingType}] Căn ${cachedProp.loaiCan} - ${cachedProp.phanKhu} | Quỹ Căn Smart City`;
            setLoading(false);
            foundInCache = true;
            
            let sims = cachedProps.filter(p => p.id !== id && p.listingType === cachedProp.listingType);
            sims.sort((a, b) => {
              if (a.loaiCan === cachedProp.loaiCan && b.loaiCan !== cachedProp.loaiCan) return -1;
              if (a.loaiCan !== cachedProp.loaiCan && b.loaiCan === cachedProp.loaiCan) return 1;
              if (a.phanKhu === cachedProp.phanKhu && b.phanKhu !== cachedProp.phanKhu) return -1;
              if (a.phanKhu !== cachedProp.phanKhu && b.phanKhu === cachedProp.phanKhu) return 1;
              return 0;
            });
            setSimilarProps(sims.slice(0, 6));
          }
        } catch(e) {}
      }

      try {
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const propData = { id: docSnap.id, ...docSnap.data() };
          if (!foundInCache) {
            setProperty(propData);
            document.title = `[${propData.listingType}] Căn ${propData.loaiCan} - ${propData.phanKhu} | Quỹ Căn Smart City`;
            setLoading(false);
          }
          
          const pkDoc = await getDoc(doc(db, 'settings', 'phanKhuConfig'));
          if (pkDoc.exists() && pkDoc.data()[propData.phanKhu]) {
            setPkConfig(pkDoc.data()[propData.phanKhu]);
          }

          if (!foundInCache) {
            const q = query(collection(db, 'properties'), where('listingType', '==', propData.listingType), limit(30));
            const allPropsSnap = await getDocs(q);
            const allProps = allPropsSnap.docs.map(d => ({id: d.id, ...d.data()}));
            
            let sims = allProps.filter(p => p.id !== docSnap.id);
            sims.sort((a, b) => {
              if (a.loaiCan === propData.loaiCan && b.loaiCan !== propData.loaiCan) return -1;
              if (a.loaiCan !== propData.loaiCan && b.loaiCan === propData.loaiCan) return 1;
              if (a.phanKhu === propData.phanKhu && b.phanKhu !== propData.phanKhu) return -1;
              if (a.phanKhu !== propData.phanKhu && b.phanKhu === propData.phanKhu) return 1;
              return 0;
            });
            setSimilarProps(sims.slice(0, 6));
          }
        } else {
          setLoading(false);
        }
      } catch (error) { 
        console.error("Lỗi:", error); 
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Căn hộ ${property?.loaiCan} - ${property?.phanKhu}`, url: url }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      alert('Đã copy link thông tin căn hộ!');
    }
  };
  
  const handleCopyCode = () => {
    if(!property) return;
    navigator.clipboard.writeText(property.maCan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollSimilar = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      if (direction === 'left') current.scrollBy({ left: -300, behavior: 'smooth' });
      else current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const checkSpam = () => {
    const lastSent = localStorage.getItem('lastFormSubmit');
    if (lastSent && Date.now() - parseInt(lastSent) < 60000) {
      alert('Vui lòng đợi 1 phút trước khi gửi yêu cầu tiếp theo!');
      return false;
    }
    localStorage.setItem('lastFormSubmit', Date.now());
    return true;
  };

  const handleFindSubmit = async (e) => {
    e.preventDefault();
    if (!checkSpam()) return;
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(findData.soDienThoai)) { setFindPhoneError("Số điện thoại không hợp lệ!"); return; }
    setIsSendingFind(true);

    try { await addDoc(collection(db, 'nho_tim_can'), { ...findData, source: 'Trang Chi Tiết Căn', createdAt: serverTimestamp(), status: 'Chưa xử lý' }); } catch(err) {}

    const BOT_TOKEN = "7295171731:AAEUgA3z1y3D6o_cK8t6W42aXfN-6I"; 
    const CHAT_ID = "6190858172";
    if (BOT_TOKEN && CHAT_ID) {
      const message = `🚨 <b>KHÁCH TÌM CĂN MỚI!</b>\n\n👤 <b>Tên khách:</b> ${findData.ten || 'Chưa nhập'}\n📌 <b>Nhu cầu:</b> ${findData.nhuCau}\n🛏 <b>Loại căn:</b> ${findData.loaiCan}\n💰 <b>Tài chính:</b> ${findData.taiChinh}\n🛋 <b>Nội thất:</b> ${findData.noiThat}\n📅 <b>Vào ở:</b> ${findData.nhuCau === 'Cho thuê' ? findData.ngayVaoO || 'Chưa rõ' : 'N/A'}\n📞 <b>SĐT Khách:</b> <code>${findData.soDienThoai}</code>\n📝 <b>Yêu cầu thêm:</b> ${findData.ghiChu || 'Không có'}`;
      try { await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' }) }); } catch (error) {}
    }
    setIsSendingFind(false); setIsFindModalOpen(false);
    setFindData({ nhuCau: 'Cho thuê', loaiCan: 'Studio', taiChinh: '', noiThat: 'Đầy đủ nội thất', ngayVaoO: '', soDienThoai: '', ghiChu: '', ten: '' });
    alert("Đã gửi yêu cầu thành công! Chuyên viên An Ninh sẽ liên hệ Zalo anh/chị ngay nhé!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col relative pb-20 md:pb-0">
        <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm">
          <Link href="/"><img src="/logo.png" alt="Quỹ Căn Smart City" className="h-10 md:h-12 w-auto object-contain" /></Link>
        </header>
        <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 flex-grow w-full">
           <SkeletonDetail />
        </main>
      </div>
    );
  }

  if (!property) return <div className="text-center py-20 font-bold text-gray-500">Không tìm thấy căn hộ!</div>;

  const images = property.images || [];
  let formattedDate = 'Đang cập nhật';
  if (property.ngayNhanNha) {
    const d = new Date(property.ngayNhanNha);
    formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  const displayId = property.maCan || property.id.substring(0, 5).toUpperCase();
  const titleString = `${property.listingType === 'Cho thuê' ? 'Cho thuê' : 'Bán'} căn hộ ${property.loaiCan || property.type}, tòa ${property.toaNha || property.building}, phân khu ${property.phanKhu}`;

  // ĐÃ SỬA: Chữ "Vào luôn" trở về màu thường và font thường
  const specs = property.listingType === 'Cho thuê' ? [
    { label: 'Loại căn', val: property.loaiCan || property.type, icon: '🏠' },
    { label: 'Diện tích', val: `${property.area} m²`, icon: '📐' },
    { label: 'Tòa nhà', val: `Tòa ${property.toaNha || property.building}`, icon: '🏢' },
    { label: 'Phân khu', val: property.phanKhu, icon: '📍' },
    { label: 'Khoảng tầng', val: property.khoangTang, icon: '🏢' },
    { label: 'Hướng ban công', val: property.huongBanCong || 'Đang cập nhật', icon: '🧭' },
    { label: 'Nội thất', val: property.noiThat || 'Đang cập nhật', icon: '🛋️' },
    { label: 'Ngày chuyển vào', val: property.vaoLuon ? 'Vào luôn' : formattedDate, icon: '📅' },
    { label: 'Phí dịch vụ', val: pkConfig.phi || 'Đang cập nhật', icon: '💰' },
  ] : [
    { label: 'Loại căn', val: property.loaiCan || property.type, icon: '🏠' },
    { label: 'Diện tích', val: `${property.area} m²`, icon: '📐' },
    { label: 'Tòa nhà', val: `Tòa ${property.toaNha || property.building}`, icon: '🏢' },
    { label: 'Phân khu', val: property.phanKhu, icon: '📍' },
    { label: 'Khoảng tầng', val: property.khoangTang, icon: '🏢' },
    { label: 'Hướng ban công', val: property.huongBanCong || 'Đang cập nhật', icon: '🧭' },
    { label: 'Nội thất', val: property.noiThat || 'Đang cập nhật', icon: '🛋️' },
    { label: 'Pháp lý', val: property.phapLy || 'Sổ đỏ', icon: '📜' }, 
    { label: 'Phí dịch vụ', val: pkConfig.phi || 'Đang cập nhật', icon: '💰' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col relative pb-20 md:pb-0">
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm">
        <Link href="/" onClick={clearFilterCacheAndReset} className="flex items-center hover:opacity-80 transition"><img src="/logo.png" alt="Quỹ Căn Smart City" className="h-10 md:h-12 w-auto object-contain" /></Link>
        <div className="flex items-center gap-3 md:gap-4">
           <Link href="/ky-gui" className="hidden md:flex items-center gap-1.5 bg-blue-50 text-blue-800 px-4 py-2 rounded-md font-bold hover:bg-blue-100 transition text-sm border border-blue-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 001 1m-6 0h6"></path></svg> Ký gửi căn hộ</Link>
           <a href={`tel:${CONTACT_PHONE}`} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-5 py-2 rounded-full font-bold hover:opacity-90 transition shadow-md text-sm"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.2-.6-2.4-.6-3.6 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1zM19 12h2a9 9 0 00-9-9v2c3.9 0 7.1 3.2 7.1 7.1zM15 12h2c0-2.8-2.2-5-5-5v2c1.7 0 3 1.3 3 3z"/></svg> <span className="hidden sm:inline">Liên hệ tư vấn</span><span className="sm:hidden">Liên hệ</span></a>
        </div>
      </header>

      {isLightboxOpen && property && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
           <button onClick={() => setIsLightboxOpen(false)} className="absolute top-6 right-6 text-white hover:text-gray-300 p-2 z-10"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
           <button onClick={() => setLightboxImg(p => p > 0 ? p - 1 : (property.images?.length || 1) - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-4 hover:bg-white/10 rounded-full z-10"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
           <img src={optimizeImg(property.images[lightboxImg])} alt="Full" className="max-w-full max-h-[90vh] object-contain" />
           <button onClick={() => setLightboxImg(p => p < (property.images?.length || 1) - 1 ? p + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-4 hover:bg-white/10 rounded-full z-10"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
           <div className="absolute bottom-6 text-white text-sm font-medium">{lightboxImg + 1} / {property.images?.length || 1}</div>
        </div>
      )}

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 flex-grow w-full">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-blue-900 hover:text-blue-700 mb-6 transition"><span className="mr-2">←</span> Quay lại danh sách</Link>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full min-w-0">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-8 relative">
              {property.nhanDan && property.nhanDan !== 'Không có' && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-black uppercase shadow-lg z-10 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 12a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0zM21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9 9-4.03 9-9zm-9-7.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm1 11.5h-2v-2h2v2zm0-3.5h-2v-5h2v5z"></path></svg>
                  {property.nhanDan}
                </div>
              )}
              <div className="relative h-[400px] md:h-[500px] bg-gray-200 group cursor-zoom-in" onClick={() => { setLightboxImg(currentImg); setIsLightboxOpen(true); }}>
                {images.length > 0 ? (
                  <>
                    <img src={optimizeImg(images[currentImg])} alt="Căn hộ" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                       <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition shadow-sm drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                    </div>
                  </>
                ) : <div className="flex items-center justify-center h-full text-gray-400">Chưa có ảnh</div>}
                
                {images.length > 1 && (
                  <>
                    <button onClick={(e) => {e.stopPropagation(); setCurrentImg(prev => prev > 0 ? prev - 1 : prev)}} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-blue-900 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition backdrop-blur-sm">‹</button>
                    <button onClick={(e) => {e.stopPropagation(); setCurrentImg(prev => prev < images.length - 1 ? prev + 1 : prev)}} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-blue-900 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition backdrop-blur-sm">›</button>
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium tracking-widest backdrop-blur-md">{currentImg + 1} / {images.length}</div>
                  </>
                )}
              </div>
              
              <div className="flex bg-gray-50 border-t border-gray-100 p-2 gap-2 min-h-[80px]">
                <div className="flex-1 flex gap-2 overflow-x-auto hide-scrollbar snap-x">
                  {images.map((img, idx) => (
                    <div key={idx} onClick={() => setCurrentImg(idx)} className={`snap-center flex-shrink-0 w-24 h-16 rounded-md cursor-pointer overflow-hidden border-2 transition-all ${currentImg === idx ? 'border-blue-600 shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={optimizeImg(img)} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {images.length === 0 && <div className="text-sm text-gray-400 flex items-center px-4 w-full h-16">Chưa có ảnh chi tiết</div>}
                </div>
                
                <div className="w-[110px] md:w-[130px] shrink-0 bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition relative" onClick={handleCopyCode}>
                   <span className="text-[10px] text-blue-600 font-bold uppercase mb-1">Mã Căn</span>
                   <div className="flex items-center gap-1.5 text-blue-900">
                     <span className="font-black text-sm md:text-base truncate max-w-[80px]">{displayId}</span>
                     <svg className="w-4 h-4 shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                   </div>
                   {copied && <span className="absolute -top-3 right-2 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded shadow">Đã copy!</span>}
                </div>
              </div>
            </div>

            <div className="mb-8 border-b border-gray-200 pb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-blue-950 mb-6 leading-tight">{titleString}</h1>
              
              <div className="flex justify-between items-center bg-white">
                 <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{property.listingType === 'Chuyển nhượng' ? 'Giá bán:' : 'Giá thuê:'}</span>
                    <span className="text-4xl md:text-5xl font-black text-blue-700 tracking-tight">{property.price}</span>
                    <span className="text-lg font-bold text-blue-700/80">{property.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'Triệu/tháng'}</span>
                 </div>
                 <button onClick={handleShare} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-sm transition bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full shadow-sm">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                   Chia sẻ
                 </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm mb-8">
              <h3 className="font-bold text-blue-900 mb-6 text-lg border-b border-gray-100 pb-3">Thông tin chi tiết</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 text-[13px] md:text-sm">
                {specs.map((s, i) => (
                  <li key={i} className="flex py-3.5 border-b border-gray-100 items-center justify-between md:justify-start md:gap-8">
                    <span className="text-gray-800 font-bold flex items-center gap-2.5 md:w-1/2">
                      <span className="text-lg w-5 text-center">{s.icon}</span> {s.label}
                    </span>
                    <span className={`font-medium text-right md:text-left ${s.color || 'text-gray-700'} md:w-1/2`}>
                      {s.val}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CLICK ĐỂ NHẢY SANG TRANG PHÂN KHU RIÊNG (NẾU ĐÃ NHẬP DỮ LIỆU) */}
            {(pkConfig.tongQuan || pkConfig.uuDiem) && (
              <div className="bg-blue-50/50 rounded-2xl p-6 md:p-8 border border-blue-100 mb-8 hover:bg-blue-100/50 transition duration-300">
                <Link href={`/phan-khu/${slugify(property.phanKhu)}`} className="block group cursor-pointer">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-blue-900 text-lg group-hover:text-blue-700 transition">Vì sao nên chọn {property.phanKhu}?</h3>
                    <svg className="w-6 h-6 text-blue-600 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </div>
                  {pkConfig.tongQuan && <p className="text-sm text-gray-700 leading-relaxed mb-4">{pkConfig.tongQuan}</p>}
                  {pkConfig.uuDiem && (
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {pkConfig.uuDiem.split(';').filter(Boolean).map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-800 font-medium">
                           <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                           {line.trim()}
                        </li>
                      ))}
                    </ul>
                  )}
                </Link>
              </div>
            )}

            {similarProps.length > 0 && (
              <div className="mb-8 relative group w-full overflow-hidden">
                <h3 className="font-bold text-blue-900 mb-4 text-lg">Các căn {property.listingType} tương tự</h3>
                <button onClick={() => scrollSimilar('left')} className="absolute left-0 top-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 hidden md:flex text-blue-900 hover:bg-blue-50 font-bold text-xl">‹</button>
                <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 snap-x relative scroll-smooth hide-scrollbar w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {similarProps.map(item => <MiniPropertyCard key={item.id} item={item} />)}
                </div>
                <button onClick={() => scrollSimilar('right')} className="absolute right-0 top-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 hidden md:flex text-blue-900 hover:bg-blue-50 font-bold text-xl">›</button>
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm mb-10 w-full mt-8">
              <div>
                <h4 className="text-xl font-bold text-blue-900 mb-2">Không cần tự lướt hết quỹ căn</h4>
                <p className="text-sm text-gray-600 font-medium">Gửi nhu cầu của bạn, chúng tôi sẽ chọn 3-5 căn phù hợp nhất để gửi lại bạn nhanh nhất.</p>
              </div>
              <button onClick={() => { setFindData({...findData, nhuCau: property.listingType, loaiCan: property.loaiCan || property.type}); setIsFindModalOpen(true); }} className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-3.5 rounded-xl font-bold whitespace-nowrap transition shadow-lg shadow-blue-900/20 flex items-center gap-2 w-full md:w-auto justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Nhờ tìm căn phù hợp
              </button>
            </div>
          </div>

          <aside className="w-full lg:w-[320px] flex-shrink-0 self-start sticky top-24">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
              <h2 className="text-xl font-black text-blue-900 uppercase tracking-tight mb-2 text-center">Liên hệ tư vấn</h2>
              <div className="flex justify-center mb-4">
                <span className="bg-blue-50 text-blue-800 font-bold px-4 py-1.5 rounded-full text-xs border border-blue-100 uppercase tracking-widest">Quỹ Căn Smart City</span>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed text-center">Chuyên viên trực tiếp 24/7. Hỗ trợ thông tin pháp lý, xem nhà thực tế và thương lượng mức giá tốt nhất cho anh/chị.</p>
              
              <div className="space-y-3">
                <a href={`tel:${CONTACT_PHONE}`} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-600/20">📞 Gọi {CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a>
                <a href={`https://zalo.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Xin chào, tôi quan tâm căn Mã ${displayId} (${property?.listingType} ${property?.loaiCan} tòa ${property?.toaNha}) trên web.`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-white border-2 border-blue-100 text-blue-800 py-3 rounded-xl font-bold hover:bg-blue-50 transition">💬 Nhận tư vấn căn này</a>
                <button onClick={handleShare} className="flex items-center justify-center gap-2 w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition mt-2">🔗 Chia sẻ thông tin căn</button>
              </div>
              <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <div className="w-32 h-32 mx-auto bg-white border border-gray-200 p-2 rounded-lg shadow-sm mb-3 flex items-center justify-center"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://zalo.me/${CONTACT_PHONE}`} alt="QR Code Zalo" className="w-full h-full object-cover rounded" /></div>
                <p className="text-xs text-gray-500 font-medium">Quét QR Zalo - <span className="font-bold text-gray-800">{CONTACT_PHONE}</span></p>
              </div>
            </div>
          </aside>
        </div>
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
               <h3 className="text-lg font-bold flex items-center gap-2">🕵️ Nhờ chuyên viên tìm căn</h3>
               <button onClick={() => setIsFindModalOpen(false)} className="text-blue-200 hover:text-white transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6 italic font-medium">Anh/chị chỉ cần để lại nhu cầu, chúng em sẽ lọc ra 3-5 căn đẹp nhất, giá tốt nhất và gửi qua Zalo ngay sau 5 phút!</p>
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
                   <textarea rows="2" placeholder="VD: Cần tầng trung, ưu tiên view công viên..." value={findData.ghiChu} onChange={(e)=>setFindData({...findData, ghiChu: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 bg-gray-50 font-medium"></textarea>
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
        <a href={`https://zalo.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Xin chào, tôi quan tâm căn Mã ${displayId} trên web.`)}`} target="_blank" rel="noreferrer" className="flex-1 bg-blue-50 border border-blue-200 text-blue-800 flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold text-sm">
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