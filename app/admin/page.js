'use client';
import { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AdminPage() {
  const [formData, setFormData] = useState({ maCan: '', type: 'Studio', area: '', building: '', floor: 'Trung', price: '' });
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

      alert('Đã thêm căn hộ thành công!');
      setFormData({ maCan: '', type: 'Studio', area: '', building: '', floor: 'Trung', price: '' });
      setImages([]);
    } catch (error) {
      console.error('Lỗi:', error);
      alert('Có lỗi xảy ra, vui lòng kiểm tra lại!');
    }
    
    setIsUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900 font-sans">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-800">Đăng Căn Hộ Lên Web</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="maCan" value={formData.maCan} onChange={handleInputChange} placeholder="Mã căn (VD: CV4005)" className="p-2 border rounded" required />
            <select name="type" value={formData.type} onChange={handleInputChange} className="p-2 border rounded">
              <option>Studio</option><option>1 Phòng ngủ</option><option>2 Phòng ngủ</option><option>3 Phòng ngủ</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <input name="area" value={formData.area} onChange={handleInputChange} type="number" placeholder="Diện tích (m2)" className="p-2 border rounded" required />
             <input name="price" value={formData.price} onChange={handleInputChange} type="number" step="0.1" placeholder="Giá (Triệu/tháng)" className="p-2 border rounded" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input name="building" value={formData.building} onChange={handleInputChange} placeholder="Tòa (VD: WESTC)" className="p-2 border rounded" required />
            <select name="floor" value={formData.floor} onChange={handleInputChange} className="p-2 border rounded">
              <option>Thấp</option><option>Trung</option><option>Cao</option>
            </select>
          </div>
          <div className="border-2 border-dashed p-4 text-center rounded bg-gray-50">
            <label className="block font-bold mb-2 cursor-pointer">Bôi đen chọn 5-7 ảnh tải lên</label>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full" />
            <p className="text-sm text-green-600 mt-2 font-bold">Đã chọn: {images.length} ảnh</p>
          </div>
          <button type="submit" disabled={isUploading} className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400">
             {isUploading ? 'Đang đẩy dữ liệu lên mạng...' : 'Đăng Căn Hộ'}
          </button>
        </form>
      </div>
    </div>
  );
}