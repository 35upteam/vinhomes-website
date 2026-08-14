'use client';
import { useEffect, useState } from 'react';
import { db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
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
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu chi tiết:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div></div>;
  if (!property) return <div className="text-center py-20">Không tìm thấy căn hộ!</div>;

  const images = property.images || [];
  
  let formattedDate = 'Đang cập nhật';
  if (property.ngayNhanNha) {
    const d = new Date(property.ngayNhanNha);
    formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  const displayId = property.maCan || property.id.substring(0, 5).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm">
              <path fill="#1e3a8a" d="M12 2L1 12h3v9h16v-9h3L12 2z"/>
              <path fill="#1e3a8a" d="M10.5 16.5l-3-3 1.41-1.41 1.59 1.59 4.59-4.59L16.5 10.5l-6 6z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-blue-900 leading-none uppercase tracking-widest mb-1">Quỹ Căn Smart City</h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Kênh phân phối BĐS Uy Tín</p>
          </div>
        </Link>
        <a href={`tel:${CONTACT_PHONE}`} className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition text-sm shadow-md">Liên hệ</a>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 flex-grow w-full">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-blue-900 hover:text-blue-700 mb-6 transition">
          <span className="mr-2">←</span> Quay lại danh sách
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full">
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
                <div className="flex gap-2 p-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <div key={idx} onClick={() => setCurrentImg(idx)} className={`flex-shrink-0 w-24 h-16 rounded cursor-pointer overflow-hidden border-2 transition ${currentImg === idx ? 'border-blue-600' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={img} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-8">
              <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest mb-3">
                {property.listingType || 'Cho thuê'}
              </span>
              <h1 className="text-3xl font-bold text-blue-900 mb-3 leading-tight">
                {property.listingType === 'Cho thuê' ? 'Thuê căn hộ' : 'Bán căn hộ'} {property.loaiCan || property.type} tòa {property.toaNha || property.building}
              </h1>
              <div className="text-3xl font-bold text-blue-700 mb-6">
                {property.price} <span className="text-lg font-medium text-gray-600">{property.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'triệu/tháng'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Loại căn', val: property.loaiCan || property.type, icon: '🛏️' },
                { label: 'Diện tích', val: `${property.area} m²`, icon: '📐' },
                { label: 'Hướng ban công', val: property.huongBanCong || 'Đang cập nhật', icon: '🧭' },
                { label: 'Hiện trạng nội thất', val: property.noiThat || 'Đang cập nhật', icon: '🛋️' },
                { label: 'Phí dịch vụ', val: serviceFee, icon: '🛡️' }
              ].map((spec, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{spec.label}</p>
                  <p className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><span className="text-blue-600">{spec.icon}</span>{spec.val}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
              <h3 className="font-bold text-blue-900 mb-5">Thông tin tổng quan</h3>
              <div className="space-y-4 text-sm">
                <div className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">Mã căn</span><span className="w-2/3 font-semibold text-gray-800">{displayId}</span></div>
                <div className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">🏢 Tòa nhà</span><span className="w-2/3 font-semibold text-gray-800">Tòa {property.toaNha || property.building} · {property.khoangTang}</span></div>
                <div className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">📍 Phân khu</span><span className="w-2/3 font-semibold text-gray-800">{property.phanKhu}</span></div>
                {property.listingType === 'Cho thuê' && (
                  <div className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">📅 Ngày nhận nhà</span><span className="w-2/3 font-semibold text-gray-800">{formattedDate}</span></div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
              <h3 className="font-bold text-blue-900 mb-5">Mô tả</h3>
              <div className="text-sm text-gray-700 leading-relaxed space-y-2 whitespace-pre-wrap">
                {property.listingType === 'Cho thuê' ? (
                  <>
                    <p>Hợp đồng 12 tháng, đóng 3 cọc 1.</p>
                    <p>Ngày vào: {formattedDate}</p>
                    <p>Nội thất: {property.noiThat}</p>
                    <p>Giá thuê: {property.price} triệu/tháng</p>
                    {property.moTa && <p className="mt-4 pt-4 border-t border-gray-100">Ghi chú khác: <br/>{property.moTa}</p>}
                  </>
                ) : (
                  <>
                    <p>- Căn hộ: {property.loaiCan || property.type}, diện tích {property.area}m², Tòa: {property.toaNha || property.building}</p>
                    <p>- Ban công: {property.huongBanCong}</p>
                    <p>- Nội thất: {property.noiThat}</p>
                    <p className="font-bold text-gray-900">- Giá bán: {property.price} Tỷ</p>
                    {property.moTa && <p className="mt-4 pt-4 border-t border-gray-100">{property.moTa}</p>}
                  </>
                )}
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[320px] flex-shrink-0 self-start sticky top-24">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Liên hệ tư vấn</p>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Quỹ Căn Smart City</h3>
              <p className="text-sm text-gray-500 mb-6 font-light">Hotline {CONTACT_PHONE} - hỗ trợ xem nhà & chốt căn nhanh.</p>
              
              <div className="space-y-3">
                <a href={`tel:${CONTACT_PHONE}`} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow">📞 Gọi {CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a>
                <a href={`https://zalo.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Xin chào, tôi quan tâm căn Mã ${displayId} (${property.listingType} ${property.loaiCan} tòa ${property.toaNha}) trên web.`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-white border border-gray-300 text-blue-900 py-3 rounded-lg font-bold hover:bg-gray-50 transition">💬 Nhắn Zalo</a>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <div className="w-32 h-32 mx-auto bg-white border border-gray-200 p-2 rounded-lg shadow-sm mb-3 flex items-center justify-center">
                   <svg viewBox="0 0 100 100" className="w-full h-full text-blue-900 opacity-80"><path fill="currentColor" d="M10 10h30v30H10V10zm5 5v20h20V15H15zm45-5h30v30H60V10zm5 5v20h20V15H65zm-55 45h30v30H10V60zm5 5v20h20V65H15zm45-5h10v10H60V60zm15 0h15v10H75V60zm-15 15h30v15H60V75zm5 5v5h20v-5H65zM35 35h10v10H35V35zm35 0h10v10H70V35zm-20 20h10v10H50V55z"></path></svg>
                </div>
                <p className="text-xs text-gray-500 font-medium">Quét QR Zalo - <span className="font-bold text-gray-800">{CONTACT_PHONE}</span></p>
              </div>
              <div className="mt-4 bg-blue-50 py-2 px-4 rounded-md text-center text-[11px] font-bold text-blue-700 border border-blue-100">
                 Mã căn: {displayId} - Đang còn hàng
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-12 px-4 md:px-12 w-full mt-auto">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-600">
           <div>
             <div className="flex items-center gap-2 mb-4">
               <div className="w-8 h-8 flex items-center justify-center">
                 <svg viewBox="0 0 24 24" className="w-full h-full">
                   <path fill="#1e3a8a" d="M12 2L1 12h3v9h16v-9h3L12 2z"/>
                   <path fill="#1e3a8a" d="M10.5 16.5l-3-3 1.41-1.41 1.59 1.59 4.59-4.59L16.5 10.5l-6 6z"/>
                 </svg>
               </div>
               <span className="font-bold text-blue-900 tracking-widest uppercase text-xs">QUỸ CĂN SMART CITY</span>
             </div>
             <p className="leading-relaxed font-light">Kênh thông tin và phân phối căn hộ chuyển nhượng, cho thuê uy tín, chuyên nghiệp tại dự án Vinhomes Smart City.</p>
           </div>
           
           <div>
             <p className="font-bold text-blue-900 mb-4 text-xs uppercase tracking-wider">Thông tin chuyên viên</p>
             <p className="mb-2 font-bold text-gray-800 text-base">Nguyễn An Ninh</p>
             <p className="font-light">Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội</p>
           </div>
           
           <div>
             <p className="font-bold text-blue-900 mb-4 text-xs uppercase tracking-wider">Liên hệ 24/7</p>
             <p className="mb-2 font-light">SĐT / Zalo: <a href={`tel:${CONTACT_PHONE}`} className="font-bold text-blue-600 hover:text-blue-800 transition">{CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a></p>
             <p className="font-light">Facebook: <a href="https://www.facebook.com/AnNinhNAN/" target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:text-blue-800 transition">Nguyễn An Ninh</a></p>
           </div>
        </div>
      </footer>
    </div>
  );
}