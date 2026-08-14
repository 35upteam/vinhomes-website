'use client';
import { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AdminPage() {
  const [formData, setFormData] = useState({ 
    listingType: 'Cho thuê', // Hoặc 'Chuyển nhượng'
    phanKhu: 'Sapphire',
    loaiCan: 'Studio', 
    toaNha: '', 
    khoangTang: 'Tầng trung', 
    huongBanCong: 'Đông Nam',
    noiThat: 'Đầy đủ nội thất',
    area: '',
    price: '' 
  });
  
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleImageChange = (e) => { if (e.target.files) setImages(Array.from(e.target.files)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return alert('Vui lòng chọn ít nhất 1 ảnh!');
    setIsUploading(true);
    
    try {
      const imageUrls = [];
      const CLOUD_NAME = "ibzfmsqp"; 
      const UPLOAD_PRESET = "upload preset";

      for (const file of images) {
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', UPLOAD_PRESET);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: data,
        });
        const uploadedImage = await res.json();
        imageUrls.push(uploadedImage.secure_url);
      }

      await addDoc(collection(db, 'properties'), {
        ...formData,
        price: Number(formData.price),
        area: Number(formData.area),
        images: imageUrls,
        createdAt: serverTimestamp(),
      });

      alert(`Đã đăng thành công căn ${formData.listingType}!`);
      setFormData({ 
        ...formData, 
        toaNha: '', area: '', price: '' // Reset các trường nhập tay
      });
      setImages([]);
    } catch (error) {
      console.error('Lỗi:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
    setIsUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-8 text-center text-blue-800 uppercase tracking-wide">Đăng tin Bất động sản</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Luồng Thuê / Bán */}
          <div className="flex gap-4 mb-4 border-b pb-6">
            <label className="flex-1 cursor-pointer">
              <input type="radio" name="listingType" value="Cho thuê" checked={formData.listingType === 'Cho thuê'} onChange={handleInputChange} className="hidden peer" />
              <div className="text-center p-3 border-2 rounded-lg peer-checked:border-blue-600 peer-checked:bg-blue-50 font-bold text-gray-500 peer-checked:text-blue-700 transition">Cho Thuê</div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input type="radio" name="listingType" value="Chuyển nhượng" checked={formData.listingType === 'Chuyển nhượng'} onChange={handleInputChange} className="hidden peer" />
              <div className="text-center p-3 border-2 rounded-lg peer-checked:border-green-600 peer-checked:bg-green-50 font-bold text-gray-500 peer-checked:text-green-700 transition">Chuyển Nhượng (Bán)</div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-600">Phân khu</label>
              <select name="phanKhu" value={formData.phanKhu} onChange={handleInputChange} className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                {['Sapphire', 'Miami', 'Sakura', 'Victoria', 'Imperia', 'Sola Park', 'Tonkin', 'Canopy', 'Masteri West Height', 'Lumiere Evergreen'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-600">Tòa nhà (VD: S1.02)</label>
              <input name="toaNha" value={formData.toaNha} onChange={handleInputChange} placeholder="Nhập tên tòa..." className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-600">Loại căn</label>
              <select name="loaiCan" value={formData.loaiCan} onChange={handleInputChange} className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                {['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-600">Khoảng tầng</label>
              <select name="khoangTang" value={formData.khoangTang} onChange={handleInputChange} className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                {['Tầng thấp', 'Tầng trung', 'Tầng cao'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-600">Hướng ban công</label>
              <select name="huongBanCong" value={formData.huongBanCong} onChange={handleInputChange} className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                {['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-600">Hiện trạng nội thất</label>
              <select name="noiThat" value={formData.noiThat} onChange={handleInputChange} className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                {['Nguyên bản CĐT', 'Đồ cơ bản', 'Đầy đủ nội thất'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div>
                <label className="block text-sm font-semibold mb-1 text-gray-600">Diện tích (m²)</label>
                <input name="area" value={formData.area} onChange={handleInputChange} type="number" step="0.1" placeholder="Nhập diện tích" className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" required />
             </div>
             <div>
                <label className="block text-sm font-semibold mb-1 text-gray-600">
                  {formData.listingType === 'Cho thuê' ? 'Giá thuê (Triệu/tháng)' : 'Giá bán (Tỷ VNĐ)'}
                </label>
                <input name="price" value={formData.price} onChange={handleInputChange} type="number" step="0.01" placeholder="VD: 15.5" className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" required />
             </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 p-6 text-center rounded-lg bg-gray-50">
            <label className="block font-bold mb-2 cursor-pointer text-gray-700">Tải lên Ảnh căn hộ (Tối đa 10 ảnh)</label>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {images.length > 0 && <p className="text-sm text-green-600 mt-3 font-bold">Đã chọn: {images.length} ảnh</p>}
          </div>

          <button type="submit" disabled={isUploading} className={`w-full text-white p-4 rounded-md font-bold text-lg transition ${formData.listingType === 'Cho thuê' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} disabled:bg-gray-400`}>
             {isUploading ? 'Đang đẩy dữ liệu lên mạng...' : `Đăng Căn ${formData.listingType}`}
          </button>
        </form>
      </div>
    </div>
  );
}