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
      {/* HEADER */}
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="h-10 md:h-12 w-auto flex items-center">
             <img src="https://i.ibb.co/tCg9sT4/logo-quy-can-smart-city.png" alt="Quỹ Căn Smart City Logo" className="h-full object-contain" />
          </div>
        </Link>
        <div className="flex items-center gap-4">
           <a href={`https://zalo.me/${CONTACT_PHONE}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-1.5 rounded-full font-medium transition text-sm">
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21.406 9.353c-.114-5.06-4.523-8.88-9.83-8.88C6.073.473 1.5 4.542 1.5 9.873c0 2.68 1.157 5.178 3.167 6.945-.333 1.09-1.077 2.37-1.196 2.585-.148.267.085.57.382.493 1.838-.475 3.33-1.393 4.22-2.025 1.12.316 2.296.485 3.504.485 5.503 0 10.073-4.068 10.073-9.4 0-.154-.01-.307-.024-.46v-.142h-.22zM15.42 11.23h-2.12v1.39h2.12v.94H12.24v-4.14h3.18v.93h-2.12v.88zM9.54 12.35l-2.01-2.92h1.99v-.94H6.38v.94l2.02 2.92H6.38v.93h3.16v-.93zM18.89 12.18c0 1.2-.84 1.82-1.92 1.82s-1.92-.62-1.92-1.82v-1.63c0-1.2.84-1.82 1.92-1.82s1.92.62 1.92 1.82v1.63zm-2.88 0c0 .64.39 1 1 1s1-.36 1-1v-1.63c0-.64-.39-1-1-1s-1 .36-1 1v1.63zM21.57 6.13c-.02-.13-.04-.26-.06-.39-.02-.12-.04-.25-.07-.37-.03-.13-.06-.25-.09-.37-.04-.12-.08-.24-.12-.36-.05-.13-.1-.25-.15-.37-.05-.12-.11-.23-.17-.35-.06-.12-.12-.24-.19-.36-.07-.12-.14-.23-.21-.34-.08-.12-.16-.23-.24-.34-.09-.11-.18-.22-.27-.33-.1-.11-.2-.21-.3-.32-.1-.1-.21-.21-.32-.3-.11-.1-.22-.2-.33-.29-.11-.09-.23-.18-.35-.26-.12-.08-.24-.16-.36-.23-.13-.07-.26-.14-.4-.2-.13-.06-.26-.11-.39-.16-.14-.05-.28-.1-.42-.14-.14-.04-.28-.08-.42-.11-.15-.03-.3-.06-.45-.08-.15-.02-.3-.04-.45-.05h-.9c-.15.01-.3.03-.45.05-.15.02-.3.05-.45.08-.14.03-.28.07-.42.11-.14.04-.28.09-.42.14-.13.05-.26.1-.39.16-.14.06-.27.13-.4.2-.12.07-.24.15-.36.23-.12.08-.24.17-.35.26-.11.09-.22.19-.33.29-.1.1-.21.2-.32.3-.11.11-.21.22-.3.32-.09.11-.18.22-.27.33-.08.11-.15-.22-.24.34-.07-.11-.14-.22-.21-.34-.07-.12-.13-.24.19-.36-.06-.12-.12-.23-.17-.35-.05-.12-.1-.24-.15-.37-.04-.12-.08-.24-.12-.36-.03-.12-.06-.24-.09-.37-.03-.12-.05-.25-.07-.37-.02-.13-.04-.26-.06-.39-.01.13-.02.26-.03.39v.78c.01.13.02.26.03.39.02.13.04.26.06.39.02.12.04.25.07.37.03.13.06.25.09.37.04.12.08.24.12.36.05.13.1.25.15.37.05.12.11.23.17.35.06.12.12.24.19.36.07.12.14.23.21.34.08.12.16.23.24.34.09.11.18.22.27.33.1.11.2.21.3.32.1.1.21.21.32.3.11.1.22.2.33.29.11.09.23.18.35.26.12.08.24.16.36.23.13.07.26.14.4.2.13.06.26.11.39.16.14.05.28.1.42.14.14.04.28.08.42.11.15.03.3.06.45.08.15.02.3.04.45.05h.9c.15-.01.3-.03.45-.05.15-.02.3-.05.45-.08.14-.03.28-.07.42-.11.14-.04.28-.09.42-.14.13-.05.26-.1.39-.16.14-.06.27-.13.4-.2.12-.07.24-.15.36-.23.12-.08.24-.17.35-.26.11-.09.22-.19.33-.29.1-.1.21-.2.32-.3.11-.11.21-.22.3-.32.09-.11.18-.22.27-.33.08-.11.15-.22.24-.34.07-.11.14-.22.21-.34.07-.12.13-.24.19-.36-.06-.12.12-.23.17-.35-.05-.12-.1-.24-.15-.37-.04-.12-.08-.24-.12-.36-.03-.12-.06-.24-.09-.37-.03-.12-.05-.25-.07-.37-.02-.13-.04-.26-.06-.39z"/></svg>
             Chat Zalo
           </a>
        </div>
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

          {/* CỘT PHẢI: STICKY BOX LIÊN HỆ */}
          <aside className="w-full lg:w-[320px] flex-shrink-0 self-start sticky top-24">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              {/* CHỮ LIÊN HỆ ĐƯỢC LÀM TO HƠN THEO YÊU CẦU */}
              <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tight mb-2">Liên hệ tư vấn</h2>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Quỹ Căn Smart City</h3>
              <p className="text-sm text-gray-500 mb-6 font-light">Hotline {CONTACT_PHONE} - hỗ trợ xem nhà & chốt căn nhanh.</p>
              
              <div className="space-y-3">
                <a href={`tel:${CONTACT_PHONE}`} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 transition shadow">📞 Gọi {CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a>
                <a href={`https://zalo.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Xin chào, tôi quan tâm căn Mã ${displayId} (${property.listingType} ${property.loaiCan} tòa ${property.toaNha}) trên web.`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-white border border-gray-300 text-blue-900 py-3 rounded-md font-bold hover:bg-gray-50 transition">💬 Nhắn Zalo</a>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <div className="w-32 h-32 mx-auto bg-white border border-gray-200 p-2 rounded-lg shadow-sm mb-3 flex items-center justify-center">
                   {/* SỬ DỤNG MÃ QR THẬT TẠO TỪ API CỦA ZALO.ME THEO SỐ ĐIỆN THOẠI */}
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://zalo.me/${CONTACT_PHONE}`} alt="QR Code Zalo" className="w-full h-full object-cover rounded" />
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
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-sm text-gray-600">
           <div className="md:pr-10">
             <div className="flex items-center gap-3 mb-6">
               <div className="h-12 w-auto flex items-center">
                 <img src="https://i.ibb.co/tCg9sT4/logo-quy-can-smart-city.png" alt="Quỹ Căn Smart City Logo" className="h-full object-contain grayscale opacity-80" />
               </div>
             </div>
             <p className="leading-relaxed font-light mb-4">Cổng thông tin dữ liệu về căn hộ chuyển nhượng, cho thuê uy tín, chuyên nghiệp tại dự án Vinhomes Smart City.</p>
             <p className="text-xs text-gray-400">© 2026 Quỹ Căn Smart City. Không phải website của chủ đầu tư.</p>
           </div>
           
           <div className="md:pl-10 md:border-l border-gray-100">
             <p className="font-bold text-blue-900 mb-5 text-xs uppercase tracking-wider">Thông tin chuyên viên</p>
             <div className="space-y-4 font-light text-[15px]">
               <p className="flex items-center gap-3"><span className="text-gray-400">👤</span> <strong className="text-gray-800">Nguyễn An Ninh</strong></p>
               <p className="flex items-center gap-3"><span className="text-gray-400">📍</span> Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội</p>
               <p className="flex items-center gap-3">
                 <span className="text-gray-400">📞</span> 
                 <a href={`tel:${CONTACT_PHONE}`} className="font-bold text-blue-600 hover:text-blue-800 transition">{CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a> 
                 <span className="text-gray-400 text-xs ml-1">(SĐT / Zalo)</span>
               </p>
             </div>
             
             <div className="flex items-center gap-4 mt-6">
                <a href="https://www.facebook.com/AnNinhNAN/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-black hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.34 2.88 2.88 0 0 1 2.31-4.53 2.66 2.66 0 0 1 1.61.53V9.5a6.33 6.33 0 0 0-3.92-1.34 6.33 6.33 0 1 0 6.33 6.33V8.67a8.4 8.4 0 0 0 6.09 2.36V7.61a5 5 0 0 1-1-.92z"/></svg>
                </a>
             </div>
           </div>
        </div>
      </footer>
    </div>
  );
}