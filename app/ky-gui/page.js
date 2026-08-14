'use client';
import { useState } from 'react';
import Link from 'next/link';
import { db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function KyGuiPage() {
  const CONTACT_PHONE = "0912791925";
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({ nhuCau: 'Cho thuê', toaNha: '', soCan: '', loaiCan: 'Studio', dienTich: '', noiThat: 'Nguyên bản CĐT', gia: '', ngayVaoO: '', ghiChu: '', soDienThoai: '' });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // HÀM GỬI THÔNG BÁO QUA TELEGRAM (Đã tích hợp API của bạn)
  const sendTelegramMessage = async (data) => {
    const BOT_TOKEN = "8975441150:AAGenhx-AvTBdgP2DUF6wT0SMoJszJGeGzU"; 
    const CHAT_ID = "5200264454";

    const message = `🚨 <b>CÓ KHÁCH KÝ GỬI MỚI!</b>\n\n`
                  + `👤 <b>Nhu cầu:</b> ${data.nhuCau}\n`
                  + `🏢 <b>Tòa/Căn:</b> ${data.toaNha} - Căn ${data.soCan}\n`
                  + `🛏 <b>Loại căn:</b> ${data.loaiCan} (${data.dienTich}m2)\n`
                  + `🛋 <b>Nội thất:</b> ${data.noiThat}\n`
                  + `💰 <b>Giá mong muốn:</b> ${data.gia}\n`
                  + `📞 <b>SĐT Khách:</b> <code>${data.soDienThoai}</code>\n`
                  + `${data.ghiChu ? `📝 <b>Ghi chú:</b> ${data.ghiChu}` : ''}`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });
    } catch (err) {
      console.error("Lỗi gửi Telegram", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await addDoc(collection(db, 'ky_gui'), { ...formData, createdAt: serverTimestamp(), status: 'Chưa xử lý' });
      await sendTelegramMessage(formData);
      setIsSubmitted(true);
    } catch (error) {
      alert("Có lỗi xảy ra, vui lòng thử lại sau hoặc liên hệ Zalo!");
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

      <section className="relative bg-blue-900 text-white py-16 px-4 md:px-12 flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-900/90 to-transparent"></div>
        <div className="relative z-10 max-w-3xl w-full">
          <span className="inline-block bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-green-500/30">
            ● Đang có khách hỏi mua/thuê mỗi ngày
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">Có căn cần bán/cho thuê?<br/>Chúng em lo tìm khách giúp anh/chị</h2>
          <p className="text-sm md:text-base text-gray-300 font-light leading-relaxed mb-6">Gửi thông tin căn hộ ngay bên dưới. Chúng em có sẵn khách đang tìm nhà mỗi ngày, đăng tin và dẫn khách xem căn giúp anh/chị — cho thuê/bán nhanh nhất, anh/chị không phải mất công tự đăng nhiều nơi rồi ngóng.</p>
          <div className="text-xs text-gray-400 space-x-2">
            <span>Chỉ mất 2 phút</span> • <span>Miễn phí đăng tin</span> • <span>Số điện thoại không hiển thị công khai</span>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 w-full -mt-8 relative z-20 mb-20">
        {isSubmitted ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Đã nhận thông tin căn của anh/chị!</h2>
            <p className="text-blue-600 font-bold text-xl mb-4">{formData.toaNha} - Căn {formData.soCan}</p>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto">Chúng tôi sẽ kiểm tra, đăng lên web trong ngày và bắt đầu tìm khách. Nếu cần bổ sung gì, chúng tôi sẽ liên hệ qua SĐT/Zalo anh/chị vừa để lại.</p>
            <Link href="/" className="inline-block border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-md font-bold transition">Xem các căn đang giao dịch</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Gửi căn — chúng em tìm khách giúp</h3>
            <p className="text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">Điền thông tin trực tiếp. Chỉ mất 2 phút, không cần tài khoản. Số điện thoại của anh/chị không hiển thị công khai.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-3">Nhu cầu của anh/chị *</label>
                <div className="flex gap-4">
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
                  <input type="text" name="toaNha" value={formData.toaNha} onChange={handleInputChange} placeholder="VD: S3.03" className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Số căn *</label>
                  <input type="text" name="soCan" value={formData.soCan} onChange={handleInputChange} placeholder="VD: 2712" className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Loại căn *</label>
                  <select name="loaiCan" value={formData.loaiCan} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none">
                    {['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Diện tích (m²)</label>
                  <input type="number" name="dienTich" value={formData.dienTich} onChange={handleInputChange} placeholder="VD: 55" className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tình trạng nội thất *</label>
                  <select name="noiThat" value={formData.noiThat} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none">
                    {['Nguyên bản CĐT', 'Đồ cơ bản', 'Đầy đủ nội thất'].map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Giá mong muốn (Triệu/Tỷ) *</label>
                  <input type="text" name="gia" value={formData.gia} onChange={handleInputChange} placeholder="VD: 8 triệu hoặc 2.5 tỷ" className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none" required />
                </div>
                {formData.nhuCau === 'Cho thuê' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ngày có thể vào ở</label>
                    <input type="date" name="ngayVaoO" value={formData.ngayVaoO} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none" />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú thêm</label>
                  <textarea name="ghiChu" value={formData.ghiChu} onChange={handleInputChange} rows="3" placeholder="VD: View công viên, có máy giặt riêng, ưu tiên khách gia đình..." className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none"></textarea>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Thông tin liên hệ</h4>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại / Zalo của anh/chị *</label>
                  <input type="text" name="soDienThoai" value={formData.soDienThoai} onChange={handleInputChange} placeholder="09xxxx..." className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none" required />
                  <p className="text-xs text-green-700 bg-green-50 p-2 mt-2 rounded">Số điện thoại chỉ dùng để chúng tôi liên hệ lại với anh/chị. <strong>Không hiển thị trên website</strong> và không cung cấp cho bên thứ ba.</p>
                </div>
              </div>

              <button type="submit" disabled={isSending} className="w-full bg-blue-900 hover:bg-blue-800 text-white p-4 rounded-md font-bold text-lg transition mt-4 disabled:bg-gray-400">
                {isSending ? 'Đang gửi dữ liệu...' : 'Gửi thông tin căn hộ'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}