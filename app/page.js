'use client';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

const PropertyCard = ({ item, contactPhone }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const [copied, setCopied] = useState(false);
  const images = item.images && item.images.length > 0 ? item.images : [];
  
  const nextImg = (e) => { e.preventDefault(); e.stopPropagation(); if (currentImg < images.length - 1) setCurrentImg(currentImg + 1); };
  const prevImg = (e) => { e.preventDefault(); e.stopPropagation(); if (currentImg > 0) setCurrentImg(currentImg - 1); };

  const handleCopy = (e) => {
    e.preventDefault(); e.stopPropagation();
    navigator.clipboard.writeText(item.maCan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Link href={`/property/${item.id}`} className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col relative">
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        {images.length > 0 ? (
          <img src={images[currentImg]} alt="Căn hộ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">Chưa có ảnh</div>}
        
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 backdrop-blur-sm">‹</button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 backdrop-blur-sm">›</button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
              {images.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all ${currentImg === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}></div>
              ))}
            </div>
          </>
        )}

        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-md text-[10px] font-extrabold text-blue-900 uppercase shadow-sm z-10">
          {item.loaiCan || item.type}
        </div>

        {/* NHÃN DÁN ĐỎ GÓC PHẢI */}
        {item.nhanDan && item.nhanDan !== 'Không có' && (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase shadow-lg z-10 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 12a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0zM21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9 9-4.03 9-9zm-9-7.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm1 11.5h-2v-2h2v2zm0-3.5h-2v-5h2v5z"></path></svg>
            {item.nhanDan}
          </div>
        )}

        {/* MÃ CĂN MỜ */}
        <div className="absolute bottom-3 right-3 bg-white/60 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-2 z-10 text-gray-800 shadow-sm border border-white/40">
          <span className="text-[10px] font-bold tracking-wide">Mã căn: {item.maCan}</span>
          <button onClick={handleCopy} className="text-gray-600 hover:text-blue-700 transition relative" title="Copy mã căn">
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
             {copied && <span className="absolute -top-7 -right-2 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded shadow whitespace-nowrap">Đã copy!</span>}
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        {/* TIÊU ĐỀ CĂN GIỮA */}
        <h3 className="font-bold text-blue-950 text-lg uppercase tracking-tight group-hover:text-blue-600 transition-colors mb-4 line-clamp-2 leading-snug text-center">
          {item.phanKhu} - Tòa {item.toaNha || item.building}
        </h3>
        
        {/* LƯỚI 2x2 CÂN ĐỐI */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <span className="bg-gray-50 border border-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-md font-normal truncate" title={`Tầng: ${item.khoangTang || 'Đang cập nhật'}`}>🏢 {item.khoangTang || 'Đang cập nhật'}</span>
          <span className="bg-gray-50 border border-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-md font-normal truncate" title={`Diện tích: ${item.area} m²`}>📐 {item.area} m²</span>
          <span className="bg-gray-50 border border-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-md font-normal truncate" title={`Hướng: ${item.huongBanCong || 'Đang cập nhật'}`}>🧭 {item.huongBanCong || 'Đang cập nhật'}</span>
          <span className="bg-gray-50 border border-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-md font-normal truncate" title={`Nội thất: ${item.noiThat || 'Đang cập nhật'}`}>🛋️ {item.noiThat || 'Đang cập nhật'}</span>
        </div>

        <div className="mt-auto border-t border-gray-100 pt-5">
          {/* GIÁ TỐI GIẢN CĂN GIỮA (ĐÃ BỎ CHỮ "GIÁ BÁN/THUÊ") */}
          <div className="mb-4 flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-blue-700">{item.price}</span>
              <span className="text-sm font-bold text-blue-700/80">{item.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'Triệu/tháng'}</span>
            </div>
          </div>
          
          <object>
            <a href={`https://zalo.me/${contactPhone}?text=${encodeURIComponent(`Xin chào, tôi muốn nhờ tư vấn căn hộ Mã ${item.maCan} (${item.listingType} ${item.loaiCan} tòa ${item.toaNha}) trên web.`)}`} target="_blank" rel="noreferrer" onClick={(e)=>e.stopPropagation()} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white text-center py-3 rounded-xl font-bold transition shadow-md shadow-blue-600/20 flex justify-center items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              Tư vấn căn này
            </a>
          </object>
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
  
  const [filters, setFilters] = useState({ phanKhu: 'Tất cả phân khu', loaiCan: [], khoangTang: 'Tất cả tầng', huongBanCong: 'Tất cả hướng', noiThat: 'Tất cả nội thất', mucGia: 'Tất cả mức giá' });
  const CONTACT_PHONE = "0912791925";

  const rentPrices = ['Tất cả mức giá', 'Dưới 6 triệu', '6 - 8 triệu', '8 - 12 triệu', '12 - 15 triệu', '15 - 20 triệu', 'Trên 20 triệu'];
  const salePrices = ['Tất cả mức giá', 'Dưới 2 tỷ', '2 - 2.5 tỷ', '2.5 - 3 tỷ', '3 - 4 tỷ', '4 - 5 tỷ', 'Trên 5 tỷ'];

  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  const [isSendingFind, setIsSendingFind] = useState(false);
  const [findPhoneError, setFindPhoneError] = useState('');
  const [findData, setFindData] = useState({ nhuCau: 'Cho thuê', loaiCan: 'Studio', taiChinh: '', noiThat: 'Đầy đủ nội thất', ngayVaoO: '', soDienThoai: '', ghiChu: '', ten: '' });

  const [isLeadPopupOpen, setIsLeadPopupOpen] = useState(false);
  const [leadData, setLeadData] = useState({ ten: '', soDienThoai: '', nhuCau: 'Mua', taiChinh: '', ghiChu: '' });
  const [isSendingLead, setIsSendingLead] = useState(false);
  const [leadPhoneError, setLeadPhoneError] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        setProperties(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error("Lỗi:", error); }
      setLoading(false);
    };
    fetchProperties();

    const timer = setTimeout(() => {
      if(!sessionStorage.getItem('leadPopupShown')) {
        setIsLeadPopupOpen(true);
        sessionStorage.setItem('leadPopupShown', 'true');
      }
    }, 20000);
    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = (e) => { setFilters({ ...filters, [e.target.name]: e.target.value }); setCurrentPage(1); };
  const handleLoaiCanToggle = (type) => { 
    setFilters(prev => ({ ...prev, loaiCan: prev.loaiCan.includes(type) ? prev.loaiCan.filter(t => t !== type) : [...prev.loaiCan, type] }));
    setCurrentPage(1);
  };
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters({...filters, loaiCan: [], mucGia: 'Tất cả mức giá'});
    setCurrentPage(1);
  };

  const checkPrice = (priceStr, rangeStr, type) => {
    if (rangeStr === 'Tất cả mức giá') return true;
    const p = parseFloat(priceStr);
    if (isNaN(p)) return true;

    if (type === 'Cho thuê') {
      if (rangeStr === 'Dưới 6 triệu') return p < 6;
      if (rangeStr === '6 - 8 triệu') return p >= 6 && p <= 8;
      if (rangeStr === '8 - 12 triệu') return p > 8 && p <= 12;
      if (rangeStr === '12 - 15 triệu') return p > 12 && p <= 15;
      if (rangeStr === '15 - 20 triệu') return p > 15 && p <= 20;
      if (rangeStr === 'Trên 20 triệu') return p > 20;
    } else {
      if (rangeStr === 'Dưới 2 tỷ') return p < 2;
      if (rangeStr === '2 - 2.5 tỷ') return p >= 2 && p <= 2.5;
      if (rangeStr === '2.5 - 3 tỷ') return p > 2.5 && p <= 3;
      if (rangeStr === '3 - 4 tỷ') return p > 3 && p <= 4;
      if (rangeStr === '4 - 5 tỷ') return p > 4 && p <= 5;
      if (rangeStr === 'Trên 5 tỷ') return p > 5;
    }
    return true;
  };

  const filteredProperties = properties.filter(item => {
    const matchTab = item.listingType === activeTab || (!item.listingType && activeTab === 'Cho thuê');
    const matchPhanKhu = filters.phanKhu === 'Tất cả phân khu' || item.phanKhu === filters.phanKhu;
    const matchKhoangTang = filters.khoangTang === 'Tất cả tầng' || item.khoangTang === filters.khoangTang;
    const matchHuong = filters.huongBanCong === 'Tất cả hướng' || item.huongBanCong === filters.huongBanCong;
    const matchNoiThat = filters.noiThat === 'Tất cả nội thất' || item.noiThat === filters.noiThat;
    const matchLoaiCan = filters.loaiCan.length === 0 || filters.loaiCan.includes(item.loaiCan) || filters.loaiCan.includes(item.type);
    const matchPrice = checkPrice(item.price, filters.mucGia, activeTab);
    return matchTab && matchPhanKhu && matchLoaiCan && matchKhoangTang && matchHuong && matchNoiThat && matchPrice;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'priceAsc') return a.price - b.price;
    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
  });

  const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
  const currentProperties = sortedProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFindSubmit = async (e) => {
    e.preventDefault();
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(findData.soDienThoai)) { setFindPhoneError("Số điện thoại không hợp lệ!"); return; }

    setIsSendingFind(true);
    
    try {
      await addDoc(collection(db, 'nho_tim_can'), { ...findData, source: 'Nút Nhờ Tìm', createdAt: serverTimestamp(), status: 'Chưa xử lý' });
    } catch(err) { console.error("Lỗi Firebase", err); }

    const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN; 
    const CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
    
    if (BOT_TOKEN && CHAT_ID) {
      const message = `🚨 <b>KHÁCH TÌM CĂN (Nút Nhờ Tìm)</b>\n\n👤 <b>Khách hàng:</b> ${findData.ten || 'Chưa nhập'}\n📌 <b>Nhu cầu:</b> ${findData.nhuCau}\n🛏 <b>Loại căn:</b> ${findData.loaiCan}\n💰 <b>Tài chính:</b> ${findData.taiChinh}\n🛋 <b>Nội thất:</b> ${findData.noiThat}\n📅 <b>Vào ở:</b> ${findData.nhuCau === 'Cho thuê' ? findData.ngayVaoO || 'Chưa rõ' : 'N/A'}\n📞 <b>SĐT Khách:</b> <code>${findData.soDienThoai}</code>\n📝 <b>Ghi chú:</b> ${findData.ghiChu || 'Không có'}`;
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' })
        });
      } catch (error) {}
    }
    
    setIsSendingFind(false);
    setIsFindModalOpen(false);
    setFindData({ nhuCau: 'Cho thuê', loaiCan: 'Studio', taiChinh: '', noiThat: 'Đầy đủ nội thất', ngayVaoO: '', soDienThoai: '', ghiChu: '', ten: '' });
    alert("Đã gửi yêu cầu thành công! Chuyên viên An Ninh sẽ liên hệ Zalo anh/chị ngay nhé!");
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(leadData.soDienThoai)) { setLeadPhoneError("Số điện thoại không hợp lệ!"); return; }

    setIsSendingLead(true);

    try {
      await addDoc(collection(db, 'nho_tim_can'), { ...leadData, source: 'Popup 20s', createdAt: serverTimestamp(), status: 'Chưa xử lý' });
    } catch(err) { console.error("Lỗi Firebase", err); }

    const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN; 
    const CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
    if (BOT_TOKEN && CHAT_ID) {
      const message = `🚨 <b>KHÁCH TỪ POPUP 20S</b>\n\n👤 <b>Tên khách:</b> ${leadData.ten}\n📞 <b>Số điện thoại:</b> <code>${leadData.soDienThoai}</code>\n📌 <b>Nhu cầu:</b> Tìm ${leadData.nhuCau}\n💰 <b>Tài chính:</b> ${leadData.taiChinh || 'Không ghi'}\n📝 <b>Ghi chú thêm:</b> ${leadData.ghiChu || 'Không có'}`;
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' })
        });
      } catch (error) {}
    }
    setIsSendingLead(false);
    setIsLeadPopupOpen(false);
    alert("Gửi yêu cầu thành công! Chuyên viên An Ninh sẽ tìm và gửi báo giá qua Zalo cho anh/chị trong ít phút.");
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col relative">
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center hover:opacity-80 transition">
          <img src="/logo.png" alt="Quỹ Căn Smart City" className="h-10 md:h-12 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-3 md:gap-4">
           <Link href="/ky-gui" className="hidden md:flex items-center gap-1.5 bg-blue-50 text-blue-800 px-4 py-2 rounded-md font-bold hover:bg-blue-100 transition text-sm border border-blue-100">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
             Ký gửi căn hộ
           </Link>
           <a href={`https://zalo.me/${CONTACT_PHONE}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-5 py-2 rounded-full font-bold hover:opacity-90 transition shadow-md text-sm">
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.2-.6-2.4-.6-3.6 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1zM19 12h2a9 9 0 00-9-9v2c3.9 0 7.1 3.2 7.1 7.1zM15 12h2c0-2.8-2.2-5-5-5v2c1.7 0 3 1.3 3 3z"/></svg> Liên hệ tư vấn
           </a>
        </div>
      </header>
      
      {/* BANNER ẢNH NỘI BỘ MỚI */}
      <section className="relative bg-blue-950 text-white py-24 px-4 md:px-12 flex items-center overflow-hidden">
        {/* Lấy ảnh banner.jpg từ thư mục public */}
        <div className="absolute inset-0 bg-[url('/banner.jpg')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900/80 to-transparent"></div>
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <p className="text-xs font-bold text-blue-200 mb-4 uppercase tracking-[0.3em] drop-shadow-md">Vinhomes Smart City</p>
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight drop-shadow-lg">QUỸ CĂN CHUYỂN NHƯỢNG<br/>& CHO THUÊ</h2>
          {/* SỬA CHỮ THEO YÊU CẦU */}
          <p className="text-base md:text-lg text-blue-100 max-w-xl font-medium leading-relaxed drop-shadow-md">Bảng hàng cập nhật liên tục 24/7, hỗ trợ tìm căn theo yêu cầu.</p>
        </div>
      </section>

      {/* TABS NÚT BẤM (PILL SHAPE) CĂN GIỮA */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-10 w-full flex justify-center">
        <div className="flex gap-2 bg-gray-200/70 p-1.5 rounded-full inline-flex shadow-inner">
           <button onClick={() => handleTabChange('Cho thuê')} className={`py-2.5 px-10 rounded-full text-sm font-black uppercase tracking-wide transition-all ${activeTab === 'Cho thuê' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>Cho thuê</button>
           <button onClick={() => handleTabChange('Chuyển nhượng')} className={`py-2.5 px-10 rounded-full text-sm font-black uppercase tracking-wide transition-all ${activeTab === 'Chuyển nhượng' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>Chuyển nhượng (Bán)</button>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start flex-grow w-full">
        {/* BỘ LỌC CHI TIẾT */}
        <aside className="w-full lg:w-[280px] flex-shrink-0 bg-white p-5 rounded-xl shadow-sm border border-gray-200 sticky top-24 self-start">
          <h3 className="font-black text-lg mb-6 text-blue-900 uppercase tracking-tight">Bộ lọc chi tiết</h3>
          <div className="space-y-6">
            <div>
              <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2 block">Mức giá</label>
              <select name="mucGia" value={filters.mucGia} onChange={handleFilterChange} className="w-full p-2.5 border border-gray-200 rounded-md text-sm font-normal text-gray-700 focus:border-blue-600 outline-none">
                {(activeTab === 'Cho thuê' ? rentPrices : salePrices).map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2 block">Phân khu</label>
              <select name="phanKhu" value={filters.phanKhu} onChange={handleFilterChange} className="w-full p-2.5 border border-gray-200 rounded-md text-sm font-normal text-gray-700 focus:border-blue-600 outline-none">
                <option>Tất cả phân khu</option>
                {['Sapphire', 'Miami', 'Sakura', 'Victoria', 'Imperia', 'Sola Park', 'Tonkin', 'Canopy', 'Masteri West Height', 'Lumiere Evergreen'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                 <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider block">Loại căn</label>
                 {filters.loaiCan.length > 0 && <span className="text-[9px] text-blue-600 font-bold cursor-pointer hover:underline" onClick={()=>setFilters({...filters, loaiCan:[]})}>Xóa lọc</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                 {['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(type => {
                   const isSelected = filters.loaiCan.includes(type);
                   return (
                     <button key={type} onClick={() => handleLoaiCanToggle(type)} className={`border py-2 px-2 rounded-md text-[11px] font-normal transition flex items-center justify-center gap-1 ${isSelected ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:border-blue-400'}`}>
                       {isSelected && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                       {type}
                     </button>
                   );
                 })}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2 block">Khoảng tầng</label>
              <select name="khoangTang" value={filters.khoangTang} onChange={handleFilterChange} className="w-full p-2.5 border border-gray-200 rounded-md text-sm font-normal text-gray-700 focus:border-blue-600 outline-none">
                <option>Tất cả tầng</option>
                {['Tầng thấp', 'Tầng trung', 'Tầng cao'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2 block">Hướng ban công</label>
              <select name="huongBanCong" value={filters.huongBanCong} onChange={handleFilterChange} className="w-full p-2.5 border border-gray-200 rounded-md text-sm font-normal text-gray-700 focus:border-blue-600 outline-none">
                <option>Tất cả hướng</option>
                {['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2 block">Nội thất</label>
              <select name="noiThat" value={filters.noiThat} onChange={handleFilterChange} className="w-full p-2.5 border border-gray-200 rounded-md text-sm font-normal text-gray-700 focus:border-blue-600 outline-none">
                <option>Tất cả nội thất</option>
                {['Nguyên bản CĐT', 'Đồ cơ bản', 'Đầy đủ nội thất'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </aside>

        <section className="flex-1 w-full flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4 sm:border-0 sm:pb-0 border-gray-200">
             <div>
               <h3 className="text-xl font-bold text-blue-900 inline-block mr-2">{activeTab}</h3>
               <span className="text-[13px] font-normal text-gray-500 inline-block mt-1 sm:mt-0">Tìm thấy {sortedProperties.length} căn hộ phù hợp</span>
             </div>
             <div className="flex items-center gap-2 w-full sm:w-auto bg-gray-100 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:block">Sắp xếp:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto text-sm border-gray-200 rounded-md border py-2 px-3 text-gray-700 focus:outline-none focus:border-blue-600 bg-white cursor-pointer shadow-sm">
                  <option value="newest">⏳ Cập nhật mới nhất</option>
                  <option value="priceAsc">📈 Giá từ thấp đến cao</option>
                </select>
             </div>
          </div>

          {currentProperties.length === 0 ? (
             <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm flex-grow"><p className="text-gray-500">Chưa có quỹ căn phù hợp với bộ lọc của bạn.</p></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {currentProperties.map(item => <PropertyCard key={item.id} item={item} contactPhone={CONTACT_PHONE} />)}
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm mb-10 w-full mt-8">
                <div>
                    <h4 className="text-xl font-bold text-blue-900 mb-2">Không cần tự lướt hết quỹ căn</h4>
                    <p className="text-sm text-gray-600">Gửi nhu cầu của bạn, chúng tôi sẽ chọn 3-5 căn phù hợp nhất để gửi lại bạn nhanh nhất.</p>
                </div>
                <button onClick={() => { setFindData({...findData, nhuCau: activeTab}); setIsFindModalOpen(true); }} className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-3 rounded-xl font-bold whitespace-nowrap transition shadow-lg shadow-blue-900/20 flex items-center gap-2 w-full md:w-auto justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Nhờ tìm căn phù hợp
                </button>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-auto">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition">‹</button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 flex items-center justify-center rounded-md font-bold transition ${currentPage === i + 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{i + 1}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition">›</button>
                </div>
              )}
            </>
          )}
        </section>
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

      {/* MODAL TÌM CĂN (NÚT CHỦ ĐỘNG) */}
      {isFindModalOpen && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="bg-blue-900 px-6 py-4 flex justify-between items-center text-white">
               <h3 className="text-lg font-bold flex items-center gap-2">🕵️ Nhờ chuyên viên tìm căn</h3>
               <button onClick={() => setIsFindModalOpen(false)} className="text-blue-200 hover:text-white transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6 italic">Anh/chị chỉ cần để lại nhu cầu, chúng em sẽ lọc ra 3-5 căn đẹp nhất, giá tốt nhất và gửi qua Zalo ngay sau 5 phút!</p>
              <form onSubmit={handleFindSubmit} className="space-y-4 text-sm">
                 <div>
                   <label className="block font-bold text-gray-700 mb-1">Tên của anh/chị</label>
                   <input type="text" placeholder="Nhập tên..." value={findData.ten} onChange={(e)=>setFindData({...findData, ten: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-600" />
                 </div>
                 <div className="flex gap-4">
                   <label className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex items-center gap-2 cursor-pointer has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 transition">
                     <input type="radio" name="nhuCau" value="Cho thuê" checked={findData.nhuCau === 'Cho thuê'} onChange={(e)=>setFindData({...findData, nhuCau: e.target.value})} className="w-4 h-4 text-blue-600" />
                     <span className="font-bold text-gray-700">Tìm Thuê</span>
                   </label>
                   <label className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex items-center gap-2 cursor-pointer has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 transition">
                     <input type="radio" name="nhuCau" value="Chuyển nhượng" checked={findData.nhuCau === 'Chuyển nhượng'} onChange={(e)=>setFindData({...findData, nhuCau: e.target.value})} className="w-4 h-4 text-blue-600" />
                     <span className="font-bold text-gray-700">Tìm Mua</span>
                   </label>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block font-bold text-gray-700 mb-1">Loại căn *</label>
                     <select required value={findData.loaiCan} onChange={(e)=>setFindData({...findData, loaiCan: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-600 bg-white">
                        {['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(opt => <option key={opt}>{opt}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block font-bold text-gray-700 mb-1">Tầm tài chính *</label>
                     <input required type="text" placeholder={findData.nhuCau === 'Cho thuê' ? "VD: 8-10 triệu" : "VD: Dưới 3 tỷ"} value={findData.taiChinh} onChange={(e)=>setFindData({...findData, taiChinh: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-600" />
                   </div>
                   <div>
                     <label className="block font-bold text-gray-700 mb-1">Mức độ nội thất *</label>
                     <select required value={findData.noiThat} onChange={(e)=>setFindData({...findData, noiThat: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-600 bg-white">
                        {['Nguyên bản CĐT', 'Đồ cơ bản', 'Đầy đủ nội thất'].map(opt => <option key={opt}>{opt}</option>)}
                     </select>
                   </div>
                   {findData.nhuCau === 'Cho thuê' ? (
                     <div>
                       <label className="block font-bold text-gray-700 mb-1">Thời gian cần ở</label>
                       <input type="date" value={findData.ngayVaoO} onChange={(e)=>setFindData({...findData, ngayVaoO: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-600" />
                     </div>
                   ) : <div className="hidden"></div>}
                 </div>
                 
                 <div>
                   <label className="block font-bold text-gray-700 mb-1">Số điện thoại / Zalo *</label>
                   <input required type="tel" placeholder="09xxxx..." value={findData.soDienThoai} onChange={(e)=>{setFindData({...findData, soDienThoai: e.target.value}); setFindPhoneError('');}} className={`w-full p-2.5 border rounded-lg outline-none transition ${findPhoneError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-600'}`} />
                   {findPhoneError && <p className="text-red-500 text-xs font-bold mt-1">{findPhoneError}</p>}
                 </div>
                 <div>
                   <label className="block font-bold text-gray-700 mb-1">Yêu cầu thêm</label>
                   <textarea rows="2" placeholder="VD: Cần tầng trung, ưu tiên view công viên..." value={findData.ghiChu} onChange={(e)=>setFindData({...findData, ghiChu: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-600"></textarea>
                 </div>
                 <button type="submit" disabled={isSendingFind} className="w-full bg-blue-700 hover:bg-blue-800 text-white p-3.5 rounded-lg font-bold text-base transition shadow-md disabled:bg-gray-400 flex items-center justify-center gap-2 mt-2">
                   {isSendingFind ? 'Đang gửi...' : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg> Gửi yêu cầu tìm căn</>}
                 </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* POPUP BẮT LEAD THÔNG MINH (20S) VỚI GIAO DIỆN & NỘI DUNG MỚI CHUẨN VIP */}
      {isLeadPopupOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up text-center relative border-4 border-blue-100">
            <button onClick={() => setIsLeadPopupOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white">
              <div className="text-4xl mb-2">👋</div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">XIN CHÀO ANH/CHỊ!</h3>
              <p className="text-blue-100 font-medium text-sm">Chưa tìm được căn ưng ý? Đừng tốn thời gian lướt nữa!</p>
            </div>
            <div className="p-6">
              <p className="text-gray-700 font-bold mb-5 text-sm">Hãy để chuyên viên của chúng tôi hỗ trợ tìm kiếm và báo giá các căn phù hợp nhất hoàn toàn miễn phí.</p>
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                 <div>
                   <input required type="text" placeholder="Tên của anh/chị..." value={leadData.ten} onChange={(e)=>setLeadData({...leadData, ten: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 text-sm font-medium" />
                 </div>
                 <div>
                   <input required type="tel" placeholder="Số điện thoại / Zalo..." value={leadData.soDienThoai} onChange={(e)=>{setLeadData({...leadData, soDienThoai: e.target.value}); setLeadPhoneError('');}} className={`w-full p-3 bg-gray-50 border rounded-lg outline-none text-sm font-medium transition ${leadPhoneError ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-600'}`} />
                   {leadPhoneError && <p className="text-red-500 text-[11px] font-bold mt-1 text-left">{leadPhoneError}</p>}
                 </div>
                 <div className="flex gap-4">
                    <label className="flex-1 flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700"><input type="radio" name="leadNhuCau" value="Mua" checked={leadData.nhuCau === 'Mua'} onChange={(e)=>setLeadData({...leadData, nhuCau: e.target.value})} className="w-4 h-4 text-blue-600" /> Cần Mua</label>
                    <label className="flex-1 flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700"><input type="radio" name="leadNhuCau" value="Thuê" checked={leadData.nhuCau === 'Thuê'} onChange={(e)=>setLeadData({...leadData, nhuCau: e.target.value})} className="w-4 h-4 text-blue-600" /> Cần Thuê</label>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <select required value={leadData.loaiCan || ''} onChange={(e)=>setLeadData({...leadData, loaiCan: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 text-sm font-medium">
                        <option value="" disabled hidden>Loại căn...</option>
                        {['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(opt => <option key={opt}>{opt}</option>)}
                     </select>
                     <input required type="text" placeholder="Tài chính dự kiến..." value={leadData.taiChinh || ''} onChange={(e)=>setLeadData({...leadData, taiChinh: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 text-sm font-medium" />
                 </div>
                 <div>
                   <textarea rows="2" placeholder="Ghi chú thêm (Tầng, hướng, nội thất...)" value={leadData.ghiChu} onChange={(e)=>setLeadData({...leadData, ghiChu: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 text-sm font-medium"></textarea>
                 </div>
                 <button type="submit" disabled={isSendingLead} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-lg font-black uppercase tracking-wider text-sm transition shadow-lg shadow-blue-600/30 disabled:opacity-50">
                   {isSendingLead ? 'Đang gửi...' : 'Gửi yêu cầu & Nhận báo giá'}
                 </button>
              </form>
              <p className="text-[10px] text-gray-400 mt-4">Cam kết bảo mật thông tin 100%.</p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}