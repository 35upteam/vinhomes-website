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
        // Lấy thông tin căn hộ
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const propData = { id: docSnap.id, ...docSnap.data() };
          setProperty(propData);
          
          // Lấy thông tin phí dịch vụ của phân khu đó
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

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#fbfaf7]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c5a47e]"></div></div>;
  if (!property) return <div className="text-center py-20">Không tìm thấy căn hộ!</div>;

  const images = property.images || [];
  
  // Format Ngày nhận nhà
  let formattedDate = 'Đang cập nhật';
  if (property.ngayNhanNha) {
    const d = new Date(property.ngayNhanNha);
    formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  // Tạo Mã căn ảo để khách hàng đọc cho Môi giới dễ hình dung (Dùng 4 số cuối của ID database)
  const displayId = property.id.substring(0, 5).toUpperCase();

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-gray-800 font-sans">
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="w-9 h-9 border border-[#c5a47e] text-[#c5a47e] flex items-center justify-center font-serif font-medium text-lg">V</div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none uppercase tracking-widest mb-1">Vinhomes Lifestyle</h1>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest">Căn hộ chuyển nhượng & cho thuê</p>
          </div>
        </Link>
        <a href={`tel:${CONTACT_PHONE}`} className="bg-[#c5a47e] text-white px-6 py-2 rounded-md font-semibold hover:bg-[#b08d66] transition text-sm shadow-md">Liên hệ</a>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition">
          <span className="mr-2">←</span> Quay lại danh sách
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full">
            {/* Gallery Ảnh */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 mb-8">
              <div className="relative h-[400px] md:h-[500px] bg-gray-200">
                {images.length > 0 ? (
                  <img src={images[currentImg]} alt="Căn hộ" className="w-full h-full object-cover" />
                ) : <div className="flex items-center justify-center h-full text-gray-400">Chưa có ảnh</div>}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImg(prev => prev > 0 ? prev - 1 : prev)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow flex items-center justify-center transition">‹</button>
                    <button onClick={() => setCurrentImg(prev => prev < images.length - 1 ? prev + 1 : prev)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow flex items-center justify-center transition">›</button>
                    <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium tracking-widest">{currentImg + 1} / {images.length}</div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <div key={idx} onClick={() => setCurrentImg(idx)} className={`flex-shrink-0 w-24 h-16 rounded cursor-pointer overflow-hidden border-2 transition ${currentImg === idx ? 'border-[#c5a47e]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={img} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tiêu đề & Giá */}
            <div className="mb-8">
              <span className="inline-block bg-[#f8f1e7] text-[#c5a47e] px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest mb-3">
                {property.listingType || 'Cho thuê'}
              </span>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
                {property.listingType === 'Cho thuê' ? 'Thuê căn hộ' : 'Bán căn hộ'} {property.loaiCan || property.type} tòa {property.toaNha || property.building}
              </h1>
              <div className="text-3xl font-bold text-[#a07d46] mb-6">
                {property.price} <span className="text-lg font-medium text-gray-600">{property.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'triệu/tháng'}</span>
              </div>
            </div>

            {/* Thông số kỹ thuật */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Loại căn', val: property.loaiCan || property.type, icon: '🛏️' },
                { label: 'Diện tích', val: `${property.area} m²`, icon: '📐' },
                { label: 'Hướng ban công', val: property.huongBanCong || 'Đang cập nhật', icon: '🧭' },
                { label: 'Hiện trạng nội thất', val: property.noiThat || 'Đang cập nhật', icon: '🛋️' },
                { label: 'Phí dịch vụ', val: serviceFee, icon: '🛡️' }
              ].map((spec, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{spec.label}</p>
                  <p className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><span className="text-gray-400">{spec.icon}</span>{spec.val}</p>
                </div>
              ))}
            </div>

            {/* Bảng Thông tin căn */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
              <h3 className="font-bold text-gray-900 mb-5">Thông tin tổng quan</h3>
              <div className="space-y-4 text-sm">
                <div className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">Mã căn</span><span className="w-2/3 font-semibold text-gray-800">CV{displayId}</span></div>
                <div className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">🏢 Tòa nhà</span><span className="w-2/3 font-semibold text-gray-800">Tòa {property.toaNha || property.building} · {property.khoangTang}</span></div>
                <div className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">📍 Phân khu</span><span className="w-2/3 font-semibold text-gray-800">{property.phanKhu}</span></div>
                {property.listingType === 'Cho thuê' && (
                  <div className="flex border-b border-gray-100 pb-3"><span className="w-1/3 text-gray-500 font-medium">📅 Ngày nhận nhà</span><span className="w-2/3 font-semibold text-gray-800">{formattedDate}</span></div>
                )}
              </div>
            </div>

            {/* Khối Mô tả theo Template tự động */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
              <h3 className="font-bold text-gray-900 mb-5">Mô tả</h3>
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

          <aside className="w-full lg:w-[320px] flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <p className="text-[10px] font-bold text-[#c5a47e] uppercase tracking-widest mb-1">Liên hệ tư vấn</p>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Vinhomes Lifestyle</h3>
              <p className="text-sm text-gray-500 mb-6 font-light">Hotline {CONTACT_PHONE} - hỗ trợ xem nhà & chốt căn nhanh.</p>
              
              <div className="space-y-3">
                <a href={`tel:${CONTACT_PHONE}`} className="flex items-center justify-center gap-2 w-full bg-[#a07d46] text-white py-3 rounded-lg font-bold hover:bg-[#8b6a38] transition shadow">📞 Gọi {CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a>
                <a href={`https://zalo.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Xin chào, tôi quan tâm căn CV${displayId} (${property.listingType} ${property.loaiCan} tòa ${property.toaNha}) trên web.`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-white border border-gray-300 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-50 transition">💬 Nhắn Zalo</a>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <div className="w-32 h-32 mx-auto bg-white border border-gray-200 p-2 rounded-lg shadow-sm mb-3 flex items-center justify-center">
                   <svg viewBox="0 0 100 100" className="w-full h-full text-gray-800 opacity-80"><path fill="currentColor" d="M10 10h30v30H10V10zm5 5v20h20V15H15zm45-5h30v30H60V10zm5 5v20h20V15H65zm-55 45h30v30H10V60zm5 5v20h20V65H15zm45-5h10v10H60V60zm15 0h15v10H75V60zm-15 15h30v15H60V75zm5 5v5h20v-5H65zM35 35h10v10H35V35zm35 0h10v10H70V35zm-20 20h10v10H50V55z"></path></svg>
                </div>
                <p className="text-xs text-gray-500 font-medium">Quét QR Zalo - <span className="font-bold text-gray-800">{CONTACT_PHONE}</span></p>
              </div>
              <div className="mt-4 bg-[#f8f1e7] py-2 px-4 rounded text-center text-[11px] font-medium text-[#c5a47e]">
                 Mã căn: CV{displayId} - Đang còn hàng
              </div>
            </div>
          </aside>
        </div>
      </main>

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