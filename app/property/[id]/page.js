'use client';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const optimizeImg = (url) => url?.includes('cloudinary.com') ? url.replace('/upload/', '/upload/w_1000,c_limit,q_auto,f_auto/') : url;

const MiniPropertyCard = ({ item }) => {
  const images = item.images && item.images.length > 0 ? item.images : [];
  return (
    <Link href={`/property/${item.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition min-w-[260px] md:min-w-[280px] snap-start flex-shrink-0 relative">
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
  
  const [pkConfig, setPkConfig] = useState({ phi: 'Đang cập nhật', tongQuan: '', uuDiem: '' });
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const propData = { id: docSnap.id, ...docSnap.data() };
          setProperty(propData);
          
          document.title = `[${propData.listingType}] Căn ${propData.loaiCan} - ${propData.phanKhu} | Quỹ Căn Smart City`;
          
          const pkDoc = await getDoc(doc(db, 'settings', 'phanKhuConfig'));
          if (pkDoc.exists() && pkDoc.data()[propData.phanKhu]) {
            setPkConfig(pkDoc.data()[propData.phanKhu]);
          }

          const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
          const allPropsSnap = await getDocs(q);
          const allProps = allPropsSnap.docs.map(d => ({id: d.id, ...d.data()}));
          
          let sims = allProps.filter(p => p.id !== docSnap.id && p.listingType === propData.listingType);
          sims.sort((a, b) => {
            if (a.loaiCan === propData.loaiCan && b.loaiCan !== propData.loaiCan) return -1;
            if (a.loaiCan !== propData.loaiCan && b.loaiCan === propData.loaiCan) return 1;
            if (a.phanKhu === propData.phanKhu && b.phanKhu !== propData.phanKhu) return -1;
            if (a.phanKhu !== propData.phanKhu && b.phanKhu === propData.phanKhu) return 1;
            return 0;
          });
          setSimilarProps(sims.slice(0, 6));
        }
      } catch (error) { console.error("Lỗi:", error); }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Căn hộ ${property.loaiCan} - ${property.phanKhu}`, url: url }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      alert('Đã copy link thông tin căn hộ!');
    }
  };
  
  const handleCopyCode = () => {
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

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div></div>;
  if (!property) return <div className="text-center py-20">Không tìm thấy căn hộ!</div>;

  const images = property.images || [];
  let formattedDate = 'Đang cập nhật';
  if (property.ngayNhanNha) {
    const d = new Date(property.ngayNhanNha);
    formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  const displayId = property.maCan || property.id.substring(0, 5).toUpperCase();
  const titleString = `${property.listingType === 'Cho thuê' ? 'Cho thuê' : 'Bán'} căn hộ ${property.loaiCan || property.type}, tòa ${property.toaNha || property.building}, phân khu ${property.phanKhu}`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col relative pb-20 md:pb-0">
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center hover:opacity-80 transition"><img src="/logo.png" alt="Quỹ Căn Smart City" className="h-10 md:h-12 w-auto object-contain" /></Link>
        <div className="flex items-center gap-3 md:gap-4">
           <Link href="/ky-gui" className="hidden md:flex items-center gap-1.5 bg-blue-50 text-blue-800 px-4 py-2 rounded-md font-bold hover:bg-blue-100 transition text-sm border border-blue-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 001 1m-6 0h6"></path></svg> Ký gửi căn hộ</Link>
           <a href={`tel:${CONTACT_PHONE}`} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-5 py-2 rounded-full font-bold hover:opacity-90 transition shadow-md text-sm"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.2-.6-2.4-.6-3.6 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1zM19 12h2a9 9 0 00-9-9v2c3.9 0 7.1 3.2 7.1 7.1zM15 12h2c0-2.8-2.2-5-5-5v2c1.7 0 3 1.3 3 3z"/></svg> <span className="hidden sm:inline">Liên hệ tư vấn</span><span className="sm:hidden">Liên hệ</span></a>
        </div>
      </header>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
           <button onClick={() => setIsLightboxOpen(false)} className="absolute top-6 right-6 text-white hover:text-gray-300 p-2 z-10"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
           <button onClick={() => setLightboxImg(p => p > 0 ? p - 1 : images.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-4 hover:bg-white/10 rounded-full z-10"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
           <img src={optimizeImg(images[lightboxImg])} alt="Full" className="max-w-full max-h-[90vh] object-contain" />
           <button onClick={() => setLightboxImg(p => p < images.length - 1 ? p + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-4 hover:bg-white/10 rounded-full z-10"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
           <div className="absolute bottom-6 text-white text-sm font-medium">{lightboxImg + 1} / {images.length}</div>
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

            {/* BẢNG THÔNG TIN CHI TIẾT 2 CỘT */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm mb-8">
              <h3 className="font-bold text-blue-900 mb-6 text-lg border-b border-gray-100 pb-3">Thông tin chi tiết</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 text-sm">
                <li className="flex py-3 border-b border-gray-50"><span className="w-1/2 text-gray-500 font-medium">Tòa nhà</span><span className="w-1/2 font-semibold text-gray-800">Tòa {property.toaNha || property.building} · Khoảng {property.khoangTang}</span></li>
                <li className="flex py-3 border-b border-gray-50"><span className="w-1/2 text-gray-500 font-medium">Phân khu</span><span className="w-1/2 font-semibold text-gray-800">{property.phanKhu}</span></li>
                <li className="flex py-3 border-b border-gray-50"><span className="w-1/2 text-gray-500 font-medium">Loại căn</span><span className="w-1/2 font-semibold text-gray-800">{property.loaiCan || property.type}</span></li>
                <li className="flex py-3 border-b border-gray-50"><span className="w-1/2 text-gray-500 font-medium">Diện tích</span><span className="w-1/2 font-semibold text-gray-800">{property.area} m²</span></li>
                <li className="flex py-3 border-b border-gray-50"><span className="w-1/2 text-gray-500 font-medium">Hướng ban công</span><span className="w-1/2 font-semibold text-gray-800">{property.huongBanCong || 'Đang cập nhật'}</span></li>
                <li className="flex py-3 border-b border-gray-50"><span className="w-1/2 text-gray-500 font-medium">Nội thất</span><span className="w-1/2 font-semibold text-gray-800">{property.noiThat || 'Đang cập nhật'}</span></li>
                <li className="flex py-3 border-b border-gray-50"><span className="w-1/2 text-gray-500 font-medium">Phí dịch vụ</span><span className="w-1/2 font-semibold text-gray-800">{pkConfig.phi || 'Đang cập nhật'}</span></li>
                
                {/* HIỂN THỊ "VÀO LUÔN" CHO CĂN THUÊ */}
                {property.listingType === 'Cho thuê' && (
                  <li className="flex py-3 border-b border-gray-50">
                    <span className="w-1/2 text-gray-500 font-medium">Tình trạng vào ở</span>
                    <span className="w-1/2 font-semibold text-green-600">{property.vaoLuon ? 'Vào luôn' : formattedDate}</span>
                  </li>
                )}

                {/* HIỂN THỊ "PHÁP LÝ" CHO CĂN BÁN */}
                {property.listingType === 'Chuyển nhượng' && (
                  <li className="flex py-3 border-b border-gray-50">
                    <span className="w-1/2 text-gray-500 font-medium">Pháp lý</span>
                    <span className="w-1/2 font-semibold text-blue-700">{property.phapLy || 'Đang cập nhật'}</span>
                  </li>
                )}
              </ul>
            </div>

            {(pkConfig.tongQuan || pkConfig.uuDiem) && (
              <div className="bg-blue-50/50 rounded-2xl p-6 md:p-8 border border-blue-100 mb-8">
                <h3 className="font-bold text-blue-900 text-lg mb-4">Vì sao nên chọn {property.phanKhu}?</h3>
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
              </div>
            )}

            {similarProps.length > 0 && (
              <div className="mb-8 relative group">
                <h3 className="font-bold text-blue-900 mb-4 text-lg">Các căn {property.listingType} tương tự</h3>
                <button onClick={() => scrollSimilar('left')} className="absolute -left-4 top-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 hidden md:flex text-blue-900 hover:bg-blue-50 font-bold text-xl">‹</button>
                <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 snap-x relative scroll-smooth hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {similarProps.map(item => <MiniPropertyCard key={item.id} item={item} />)}
                </div>
                <button onClick={() => scrollSimilar('right')} className="absolute -right-4 top-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 hidden md:flex text-blue-900 hover:bg-blue-50 font-bold text-xl">›</button>
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm mb-10 w-full mt-8">
              <div>
                <h4 className="text-xl font-bold text-blue-900 mb-2">Không cần tự lướt hết quỹ căn</h4>
                <p className="text-sm text-gray-600">Gửi nhu cầu của bạn, chúng tôi sẽ chọn 3-5 căn phù hợp nhất để gửi lại bạn nhanh nhất.</p>
              </div>
              <button onClick={() => { setFindData({...findData, nhuCau: property.listingType, loaiCan: property.loaiCan || property.type}); setIsFindModalOpen(true); }} className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-3.5 rounded-xl font-bold whitespace-nowrap transition shadow-lg shadow-blue-900/20 flex items-center gap-2 w-full md:w-auto justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Nhờ tìm căn phù hợp
              </button>
            </div>
          </div>

          {/* CỘT LIÊN HỆ ĐÃ ĐƯỢC THIẾT KẾ LẠI THANH LỊCH HƠN */}
          <aside className="w-full lg:w-[320px] flex-shrink-0 self-start sticky top-24">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
              <h2 className="text-xl font-black text-blue-900 uppercase tracking-tight mb-2 text-center">Liên hệ tư vấn</h2>
              <div className="flex justify-center mb-4">
                <span className="bg-blue-50 text-blue-800 font-bold px-4 py-1.5 rounded-full text-xs border border-blue-100 uppercase tracking-widest">Quỹ Căn Smart City</span>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed text-center">Chuyên viên trực tiếp 24/7. Hỗ trợ thông tin pháp lý, xem nhà thực tế và thương lượng mức giá tốt nhất cho anh/chị.</p>
              
              <div className="space-y-3">
                <a href={`tel:${CONTACT_PHONE}`} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-600/20">📞 Gọi {CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a>
                <a href={`https://zalo.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Xin chào, tôi quan tâm căn Mã ${displayId} (${property.listingType} ${property.loaiCan} tòa ${property.toaNha}) trên web.`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-white border-2 border-blue-100 text-blue-800 py-3 rounded-xl font-bold hover:bg-blue-50 transition">💬 Nhận tư vấn căn này</a>
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