'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

export default function AdminPage() {
  // Trạng thái Bảo mật
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Trạng thái Form và Dữ liệu
  const initialForm = { listingType: 'Cho thuê', phanKhu: 'Sapphire', loaiCan: 'Studio', toaNha: '', khoangTang: 'Tầng trung', huongBanCong: 'Đông Nam', noiThat: 'Đầy đủ nội thất', area: '', price: '' };
  const [formData, setFormData] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Trạng thái Quản lý danh sách
  const [properties, setProperties] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Lấy dữ liệu danh sách căn hộ
  const fetchProperties = async () => {
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setProperties(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    if (isAuthenticated) fetchProperties();
  }, [isAuthenticated]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleImageChange = (e) => { if (e.target.files) setImages(Array.from(e.target.files)); };

  // Xử lý Xóa
  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa căn hộ này không?')) {
      await deleteDoc(doc(db, 'properties', id));
      alert('Đã xóa thành công!');
      fetchProperties();
    }
  };

  // Xử lý Bấm nút Sửa
  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item.id);
    setImages([]); // Yêu cầu chọn lại ảnh nếu muốn đổi ảnh, hoặc giữ ảnh cũ
    window.scrollTo(0, 0);
  };

  // Xử lý Lưu (Thêm mới hoặc Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0 && !editingId) return alert('Vui lòng chọn ít nhất 1 ảnh!');
    setIsUploading(true);
    
    try {
      let imageUrls = editingId ? formData.images : []; // Nếu đang sửa và không up ảnh mới thì giữ ảnh cũ
      
      // Nếu có chọn ảnh mới thì up lên Cloudinary
      if (images.length > 0) {
        imageUrls = []; // Reset để up ảnh mới
        const CLOUD_NAME = "ibzfmsqp"; 
        const UPLOAD_PRESET = "upload preset";
        for (const file of images) {
          const data = new FormData();
          data.append('file', file);
          data.append('upload_preset', UPLOAD_PRESET);
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
          const uploadedImage = await res.json();
          imageUrls.push(uploadedImage.secure_url);
        }
      }

      const dataToSave = {
        ...formData,
        price: Number(formData.price),
        area: Number(formData.area),
        images: imageUrls,
      };

      if (editingId) {
        // Cập nhật
        await updateDoc(doc(db, 'properties', editingId), dataToSave);
        alert('Cập nhật thông tin thành công!');
      } else {
        // Thêm mới
        await addDoc(collection(db, 'properties'), { ...dataToSave, createdAt: serverTimestamp() });
        alert(`Đã đăng thành công căn ${formData.listingType}!`);
      }

      setFormData(initialForm);
      setEditingId(null);
      setImages([]);
      fetchProperties(); // Tải lại danh sách
    } catch (error) {
      console.error('Lỗi:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
    setIsUploading(false);
  };

  // Giao diện Khóa đăng nhập
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-50">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Mật khẩu Quản trị</h2>
          <p className="text-sm text-gray-500 mb-6">Vui lòng nhập mật mã để truy cập hệ thống đăng bài.</p>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') document.getElementById('btnLogin').click()}} className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
          <button id="btnLogin" onClick={() => { if(password === '0912791925') setIsAuthenticated(true); else alert('Sai mật khẩu!'); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold transition shadow-md">Truy cập</button>
        </div>
      </div>
    );
  }

  // Giao diện Admin chính
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-gray-900 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        
        {/* KHỐI 1: FORM THÊM/SỬA */}
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md border-t-4 border-blue-600">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
             <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
               {editingId ? 'Sửa thông tin căn hộ' : 'Đăng tin Bất động sản'}
             </h1>
             {editingId && (
               <button onClick={() => {setEditingId(null); setFormData(initialForm);}} className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md font-semibold transition">Hủy sửa</button>
             )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4 mb-4">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="listingType" value="Cho thuê" checked={formData.listingType === 'Cho thuê'} onChange={handleInputChange} className="hidden peer" />
                <div className="text-center p-3 border-2 rounded-lg peer-checked:border-blue-600 peer-checked:bg-blue-50 font-bold text-gray-500 peer-checked:text-blue-700 transition">Cho Thuê</div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="listingType" value="Chuyển nhượng" checked={formData.listingType === 'Chuyển nhượng'} onChange={handleInputChange} className="hidden peer" />
                <div className="text-center p-3 border-2 rounded-lg peer-checked:border-green-600 peer-checked:bg-green-50 font-bold text-gray-500 peer-checked:text-green-700 transition">Chuyển Nhượng (Bán)</div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <label className="block font-bold mb-2 cursor-pointer text-gray-700">Tải lên Ảnh căn hộ (Bỏ trống nếu muốn giữ ảnh cũ khi đang sửa)</label>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {images.length > 0 && <p className="text-sm text-green-600 mt-3 font-bold">Đã chọn: {images.length} ảnh mới</p>}
            </div>

            <button type="submit" disabled={isUploading} className={`w-full text-white p-4 rounded-md font-bold text-lg transition ${editingId ? 'bg-orange-500 hover:bg-orange-600' : (formData.listingType === 'Cho thuê' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700')} disabled:bg-gray-400`}>
               {isUploading ? 'Đang xử lý dữ liệu...' : (editingId ? 'Cập Nhật Thông Tin' : `Đăng Căn ${formData.listingType}`)}
            </button>
          </form>
        </div>

        {/* KHỐI 2: DANH SÁCH CĂN ĐANG ĐĂNG */}
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">Danh sách căn hộ đang hiển thị ({properties.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 border-b">Loại tin</th>
                  <th className="p-3 border-b">Tòa</th>
                  <th className="p-3 border-b">Loại căn</th>
                  <th className="p-3 border-b">Giá</th>
                  <th className="p-3 border-b text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {properties.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.listingType === 'Cho thuê' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {item.listingType || 'Cho thuê'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-gray-800">{item.toaNha || item.building} <span className="text-xs font-normal text-gray-500 block">{item.phanKhu}</span></td>
                    <td className="p-3">{item.loaiCan || item.type}</td>
                    <td className="p-3 font-bold text-orange-600">{item.price} {item.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'Tr'}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 font-semibold mr-4 transition">Sửa</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 font-semibold transition">Xóa</button>
                    </td>
                  </tr>
                ))}
                {properties.length === 0 && (
                  <tr><td colSpan="5" className="p-4 text-center text-gray-500">Chưa có căn hộ nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}