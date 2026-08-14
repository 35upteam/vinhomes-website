'use client';
import { useState } from 'react';
import Link from 'next/link';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function KyGuiPage() {
  const CONTACT_PHONE = "0912791925";
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [formData, setFormData] = useState({ nhuCau: 'Cho thuê', toaNha: '', soCan: '', loaiCan: 'Studio', dienTich: '', noiThat: 'Nguyên bản CĐT', gia: '', ngayVaoO: '', ghiChu: '', soDienThoai: '' });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if(e.target.name === 'soDienThoai') setPhoneError('');
  };

  const sendTelegramMessage = async (data) => {
    const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN; 
    const CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
    if (!BOT_TOKEN || !CHAT_ID) return;

    const message = `🚨 <b>CÓ KHÁCH KÝ GỬI MỚI!</b>\n\n👤 <b>Nhu cầu:</b> ${data.nhuCau}\n🏢 <b>Tòa/Căn:</b> ${data.toaNha} - Căn ${data.soCan}\n🛏 <b>Loại căn:</b> ${data.loaiCan} (${data.dienTich}m2)\n🛋 <b>Nội thất:</b> ${data.noiThat}\n💰 <b>Giá:</b> ${data.gia}\n📞 <b>SĐT Khách:</b> <code>${data.soDienThoai}</code>\n${data.ghiChu ? `📝 <b>Ghi chú:</b> ${data.ghiChu}` : ''}`;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try { await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' }) }); } catch (err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate Phone Number
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(formData.soDienThoai)) {
      setPhoneError("Số điện thoại không hợp lệ! Vui lòng nhập đủ 10 số và bắt đầu bằng số 0.");
      return;
    }

    setIsSending(true);
    try {
      await addDoc(collection(db, 'ky_gui'), { ...formData, createdAt: serverTimestamp(), status: 'Chưa xử lý' });
      await sendTelegramMessage(formData);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert("Có lỗi xảy ra, vui lòng thử lại sau!");
    }
    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center hover:opacity-80 transition">
          <img src="/logo.png" alt="Quỹ Căn Smart City" className="h-10 md:h-12 w-auto object-contain" />
        </Link>
        <Link href="/" className="text-blue-900 font-bold hover:text-blue-600 transition text-sm">Quay về trang chủ</Link>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-12 flex flex-col lg:flex-row gap-12 w-full flex-grow">
        
        {/* CỘT TRÁI: GIỚI THIỆU */}
        <div className="w-full lg:w-5/12 self-start sticky top-28">
          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-green-200">
            ● Đang có khách hỏi mua/thuê mỗi ngày
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-blue-900 leading-[1.1]">Có căn cần bán/cho thuê?<br/>Chúng em lo tìm khách giúp anh/chị</h2>
          <p className="text-base text-gray-600 leading-relaxed mb-6">Gửi thông tin căn hộ ngay bên form. Chúng em có sẵn lượng lớn khách đang tìm nhà mỗi ngày, trực tiếp đăng tin và dẫn khách xem căn giúp anh/chị — đảm bảo cho thuê/bán nhanh nhất, anh/chị không phải mất công tự đăng nhiều nơi rồi ngóng chờ.</p>
          <ul className="space-y-3 text-sm text-gray-500 font-medium bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <li className="flex items-center gap-2"><svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Chỉ mất 2 phút điền thông tin</li>
            <li className="flex items-center gap-2"><svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Miễn phí hoàn toàn chi phí đăng tin</li>
            <li className="flex items-center gap-2"><svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Số điện thoại không bị hiển thị công khai</li>
          </ul>
        </div>

        {/* CỘT PHẢI: FORM */}
        <div className="w-full lg:w-7/12">
          {isSubmitted ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 md:p-14 text-center h-full flex flex-col justify-center items-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">Đã nhận thông tin căn của anh/chị!</h2>
              <p className="text-blue-600 font-bold text-xl mb-4">{formData.toaNha} - Căn {formData.soCan}</p>
              <p className="text-gray-600 mb-8 max-w-sm">Chúng tôi sẽ kiểm tra, và bắt đầu tư vấn khách. Nếu cần bổ sung gì, chúng tôi sẽ liên hệ qua SĐT/Zalo anh/chị vừa để lại.</p>
              <Link href="/" className="inline-block border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-md font-bold transition">Xem quỹ căn hiện tại</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Nhập thông tin căn hộ</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Nhu cầu của anh/chị *</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="nhuCau" value="Cho thuê" checked={formData.nhuCau === 'Cho thuê'} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">Cho thuê</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="nhuCau" value="Chuyển nhượng" checked={formData.nhuCau === 'Chuyển nhượng'} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">Chuyển nhượng (Bán)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tòa nhà *</label>
                    <input type="text" name="toaNha" value={formData.toaNha} onChange={handleInputChange} placeholder="VD: S101" className="w-full p-3.5 border border-gray-300 rounded-lg focus:border-blue-600 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Số căn *</label>
                    <input type="text" name="soCan" value={formData.soCan} onChange={handleInputChange} placeholder="VD: 1010" className="w-full p-3.5 border border-gray-300 rounded-lg focus:border-blue-600 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Loại căn *</label>
                    <select name="loaiCan" value={formData.loaiCan} onChange={handleInputChange} className="w-full p-3.5 border border-gray-300 rounded-lg focus:border-blue-600 outline-none bg-white">
                      {['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Diện tích (m²)</label>
                    <input type="number" name="dienTich" value={formData.dienTich} onChange={handleInputChange} placeholder="VD: 55" className="w-full p-3.5 border border-gray-300 rounded-lg focus:border-blue-600 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tình trạng nội thất *</label>
                    <select name="noiThat" value={formData.noiThat} onChange={handleInputChange} className="w-full p-3.5 border border-gray-300 rounded-lg focus:border-blue-600 outline-none bg-white">
                      {['Nguyên bản CĐT', 'Đồ cơ bản', 'Đầy đủ nội thất'].map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Giá mong muốn (Triệu/Tỷ) *</label>
                    <input type="text" name="gia" value={formData.gia} onChange={handleInputChange} placeholder="VD: 8 triệu hoặc 2.5 tỷ" className="w-full p-3.5 border border-gray-300 rounded-lg focus:border-blue-600 outline-none" required />
                  </div>
                  {formData.nhuCau === 'Cho thuê' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Ngày có thể vào ở</label>
                      <input type="date" name="ngayVaoO" value={formData.ngayVaoO} onChange={handleInputChange} className="w-full p-3.5 border border-gray-300 rounded-lg focus:border-blue-600 outline-none" />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú thêm</label>
                    <textarea name="ghiChu" value={formData.ghiChu} onChange={handleInputChange} rows="3" placeholder="VD: Nhà đầy đủ nội thất, ưu tiên khách ở gia đình, căn có vay không, có hỗ trợ khách mua vay không đối với các căn chuyển nhượng..." className="w-full p-3.5 border border-gray-300 rounded-lg focus:border-blue-600 outline-none"></textarea>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <label className="block text-sm font-bold text-blue-900 mb-2">Số điện thoại / Zalo của anh/chị *</label>
                  <input type="tel" name="soDienThoai" value={formData.soDienThoai} onChange={handleInputChange} placeholder="09xxxx..." className={`w-full p-3.5 border rounded-lg outline-none transition ${phoneError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-600'}`} required />
                  {phoneError && <p className="text-red-500 text-xs font-bold mt-1.5">{phoneError}</p>}
                  <p className="text-[11px] text-gray-500 mt-2">Số điện thoại chỉ dùng để chúng tôi liên hệ lại với anh/chị. Hệ thống cam kết bảo mật thông tin tuyệt đối.</p>
                </div>

                <button type="submit" disabled={isSending} className="w-full bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white p-4 rounded-xl font-bold text-lg transition shadow-lg disabled:opacity-70">
                  {isSending ? 'Đang gửi dữ liệu...' : 'Hoàn tất & Gửi thông tin'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-12 px-4 md:px-12 w-full mt-auto">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-sm text-gray-600">
           <div className="md:pr-10">
             <div className="flex items-center mb-6">
               <img src="/logo.png" alt="Quỹ Căn Smart City Logo" className="h-10 md:h-12 w-auto object-contain" />
             </div>
             <p className="leading-relaxed font-light mb-4">Quỹ Căn Smart City – Chuyên trang tổng hợp nguồn hàng mua bán, chuyển nhượng, cho thuê căn hộ tại Vinhomes Smart City Tây Mỗ. Cập nhật quỹ căn mới mỗi ngày tại mọi phân khu.</p>
             <p className="text-xs text-gray-400">© 2026 Quỹ Căn Smart City.</p>
           </div>
           
           <div className="md:pl-10 md:border-l border-gray-100">
             <h3 className="font-extrabold text-blue-900 mb-5 text-lg uppercase tracking-wider">Liên hệ tư vấn</h3>
             <div className="space-y-4 font-light text-[15px]">
               <p className="flex items-center gap-3"><span className="text-gray-400">👤</span> <strong className="text-gray-800">Nguyễn An Ninh</strong></p>
               <p className="flex items-center gap-3">
                 <span className="text-gray-400">📞</span> 
                 <a href={`tel:${CONTACT_PHONE}`} className="font-bold text-blue-600 hover:text-blue-800 transition text-lg">{CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a> 
                 <span className="text-gray-400 text-xs ml-1">(SĐT / Zalo)</span>
               </p>
               <p className="flex items-center gap-3"><span className="text-gray-400">📍</span> Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội</p>
             </div>
           </div>
        </div>
      </footer>
    </div>
  );
}