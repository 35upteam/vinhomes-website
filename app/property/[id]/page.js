'use client';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const MiniPropertyCard = ({ item }) => {
  const images = item.images && item.images.length > 0 ? item.images : [];
  return (
    <Link href={`/property/${item.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition min-w-[260px] md:min-w-[280px] snap-start flex-shrink-0">
      <div className="h-40 bg-gray-200 relative">
        {images.length > 0 ? (
          <img src={images[0]} alt="Căn hộ" className="w-full h-full object-cover" />
        ) : <div className="flex items-center justify-center h-full text-gray-400 text-xs">Chưa có ảnh</div>}
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-[9px] font-bold text-blue-900 uppercase">{item.loaiCan || item.type}</div>
      </div>
      <div className="p-3">
        <p className="text-[9px] text-gray-400 font-semibold mb-1 uppercase">MÃ: {item.maCan}</p>
        <h4 className="font-bold text-blue-900 text-sm truncate">{item.phanKhu} - Tòa {item.toaNha || item.building}</h4>
        <div className="text-base font-bold text-blue-700 mt-2">
          {item.listingType === 'Chuyển nhượng' ? 'Giá bán: ' : 'Giá thuê: '} {item.price} <span className="text-[10px] font-medium text-gray-500">{item.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'Tr/tháng'}</span>
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
  const [serviceFee, setServiceFee] = useState('Đang cập nhật');
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);

  const CONTACT_PHONE = "0912791925";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const propData = { id: docSnap.id, ...docSnap.data() };
          setProperty(propData);
          
          const feeRef = doc(db, 'settings', 'serviceFees');
          const feeSnap = await getDoc(feeRef);
          if (feeSnap.exists() && feeSnap.data()[propData.phanKhu]) {
            setServiceFee(`${feeSnap.data()[propData.phanKhu]} VNĐ/m²`);
          }

          // Fetch các căn tương tự
          const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
          const allPropsSnap = await getDocs(q);
          const allProps = allPropsSnap.docs.map(d => ({id: d.id, ...d.data()}));
          const sims = allProps.filter(p => p.id !== docSnap.id && p.listingType === propData.listingType).slice(0, 6);
          setSimilarProps(sims);
        }
      } catch (error) { console.error("Lỗi lấy dữ liệu:", error); }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'Căn hộ Smart City', url: url }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      alert('Đã copy link thành công!');
    }
  };

  const scrollSimilar = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      if (direction === 'left') current.scrollBy({ left: -300, behavior: 'smooth' });
      else current.scrollBy({ left: 300, behavior: 'smooth' });
    }
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
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center hover:opacity-80 transition">
          <img src="/logo.png" alt="Quỹ Căn Smart City" className="h-10 md:h-12 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-4">
           <Link href="/ky-gui" className="hidden md:block text-blue-900 font-bold hover:text-blue-600 transition text-sm">Ký gửi căn hộ</Link>
           <a href={`tel:${CONTACT_PHONE}`} className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b5852a] text-gray-900 px-5 py-2 rounded-full font-bold hover:opacity-90 transition shadow-md text-sm">
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.2-.6-2.4-.6-3.6 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1zM19 12h2a9 9 0 00-9-9v2c3.9 0 7.1 3.2 7.1 7.1zM15 12h2c0-2.8-2.2-5-5-5v2c1.7 0 3 1.3 3 3z"/></svg> Liên hệ tư vấn
           </a>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 flex-grow w-full">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-blue-900 hover:text-blue-700 mb-6 transition"><span className="mr-2">←</span> Quay lại danh sách</Link>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full min-w-0">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 mb-8">
              <div className="relative h-[400px] md:h-[500px] bg-gray-200">
                {images.length > 0 ? (
                  <img src={images[currentImg]} alt="Căn hộ" className="w-full h-full object-cover" />
                ) : <div className="flex items-center justify-center h-full text-gray-400">Chưa có ảnh</div>}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImg(prev => prev > 0 ? prev - 1 : prev)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-blue-900 w-10 h-10 rounded-full shadow flex items-center justify-center transition">‹</button>
                    <button onClick={() => setCurrentImg(prev => prev < images.length - 1 ? prev + 1 : prev)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-blue-900 w-10 h-10 rounded-full shadow flex items-center justify-center transition">›</button>
                    <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium tracking-widest">{currentImg + 1} / {images.length}</div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto hide-scrollbar">
                  {images.map((img, idx) => (
                    <div key={idx} onClick={() => setCurrentImg(idx)} className={`flex-shrink-0 w-24 h-16 rounded cursor-pointer overflow-hidden border-2 transition ${currentImg === idx ? 'border-blue-600' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={img} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-3 leading-tight">{titleString}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                 <div className="text-3xl font-extrabold text-blue-700 bg-blue-50 inline-block px-4 py-2 rounded-lg border border-blue-100">
                    {property.listingType === 'Chuyển nhượng' ? 'Giá bán: ' : 'Giá thuê: '} {property.price} <span className="text-xl font-bold text-gray-600">{property.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'Triệu/tháng'}</span>
                 </div>
                 <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-blue-900 rounded-lg font-bold transition border border-gray-200 shadow-sm">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                   Chia sẻ
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[ { label: 'Loại căn', val: property.loaiCan || property.type, icon: '🛏️' }, { label: 'Diện tích', val: `${property.area} m²`, icon: '📐' }, { label: 'Hướng ban công', val: property.huongBanCong || 'Đang cập nhật', icon: '🧭' }, { label: 'Hiện trạng nội thất', val: property.noiThat || 'Đang cập nhật', icon: '🛋️' }].map((spec, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"><p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{spec.label}</p><p className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><span className="text-blue-600">{spec.icon}</span>{spec.val}</p></div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
              <h3 className="font-bold text-blue-900 mb-5 text-lg">Thông tin chi tiết</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">Mã căn</span><span className="w-2/3 font-semibold text-gray-800">{displayId}</span></li>
                <li className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">Tòa nhà</span><span className="w-2/3 font-semibold text-gray-800">Tòa {property.toaNha || property.building} · Khoảng {property.khoangTang}</span></li>
                <li className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">Phân khu</span><span className="w-2/3 font-semibold text-gray-800">{property.phanKhu}</span></li>
                <li className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">Phí dịch vụ</span><span className="w-2/3 font-semibold text-gray-800">{serviceFee}</span></li>
                {property.listingType === 'Cho thuê' && <li className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">Ngày nhận nhà</span><span className="w-2/3 font-semibold text-gray-800">{formattedDate}</span></li>}
              </ul>
            </div>

            {similarProps.length > 0 && (
              <div className="mb-8 relative group">
                <h3 className="font-bold text-blue-900 mb-4 text-lg">Các căn {property.listingType} tương tự</h3>
                <button onClick={() => scrollSimilar('left')} className="absolute -left-4 top-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 hidden md:flex text-blue-900 hover:bg-blue-50 font-bold text-xl">‹</button>
                <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 snap-x relative scroll-smooth hide-scrollbar">
                  {similarProps.map(item => <MiniPropertyCard key={item.id} item={item} />)}
                </div>
                <button onClick={() => scrollSimilar('right')} className="absolute -right-4 top-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 hidden md:flex text-blue-900 hover:bg-blue-50 font-bold text-xl">›</button>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm mb-10 w-full mt-8">
              <div>
                <h4 className="text-xl font-bold text-blue-900 mb-2">Không cần tự lướt hết quỹ căn</h4>
                <p className="text-sm text-gray-600">Gửi nhu cầu của bạn, chúng tôi sẽ chọn 3-5 căn phù hợp nhất để gửi lại bạn nhanh nhất.</p>
              </div>
              <a href={`https://zalo.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Xin chào, tôi muốn nhờ tìm giúp một căn hộ ${property.listingType} tại Vinhomes Smart City.`)}`} target="_blank" rel="noreferrer" className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-3 rounded-md font-bold whitespace-nowrap transition shadow flex items-center gap-2 w-full md:w-auto justify-center">
                Nhờ tìm căn phù hợp
              </a>
            </div>

          </div>

          <aside className="w-full lg:w-[320px] flex-shrink-0 self-start sticky top-24">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tight mb-2">Liên hệ tư vấn</h2>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Quỹ Căn Smart City</h3>
              <p className="text-sm text-gray-500 mb-6 font-light">Hotline {CONTACT_PHONE} - hỗ trợ xem nhà & chốt căn nhanh.</p>
              <div className="space-y-3">
                <a href={`tel:${CONTACT_PHONE}`} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 transition shadow">📞 Gọi {CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a>
                <a href={`https://zalo.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Xin chào, tôi quan tâm căn Mã ${displayId} (${property.listingType} ${property.loaiCan} tòa ${property.toaNha}) trên web.`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-white border border-gray-300 text-blue-900 py-3 rounded-md font-bold hover:bg-gray-50 transition">💬 Nhắn Zalo</a>
              </div>
              <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <div className="w-32 h-32 mx-auto bg-white border border-gray-200 p-2 rounded-lg shadow-sm mb-3 flex items-center justify-center"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://zalo.me/${CONTACT_PHONE}`} alt="QR Code Zalo" className="w-full h-full object-cover rounded" /></div>
                <p className="text-xs text-gray-500 font-medium">Quét QR Zalo - <span className="font-bold text-gray-800">{CONTACT_PHONE}</span></p>
              </div>
              <div className="mt-4 bg-blue-50 py-2 px-4 rounded-md text-center text-[11px] font-bold text-blue-700 border border-blue-100">Mã căn: {displayId} - Đang còn hàng</div>
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