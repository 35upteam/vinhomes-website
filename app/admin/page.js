'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const phanKhuList = ['Sapphire', 'Miami', 'Sakura', 'Victoria', 'Imperia', 'Sola Park', 'Tonkin', 'Canopy', 'Masteri West Height', 'Lumiere Evergreen'];
  const [serviceFees, setServiceFees] = useState({});
  const [isSavingFees, setIsSavingFees] = useState(false);

  const initialForm = { listingType: 'Cho thuê', phanKhu: 'Sapphire', loaiCan: 'Studio', toaNha: '', khoangTang: 'Tầng trung', huongBanCong: 'Đông Nam', noiThat: 'Đầy đủ nội thất', area: '', price: '', ngayNhanNha: '', moTa: '' };
  const [formData, setFormData] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [properties, setProperties] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchProperties();
      fetchServiceFees();
    }
  }, [isAuthenticated]);

  const fetchProperties = async () => {
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setProperties(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchServiceFees = async () => {
    const feeDoc = await getDoc(doc(db, 'settings', 'serviceFees'));
    if (feeDoc.exists()) setServiceFees(feeDoc.data());
    else {
      const defaultFees = phanKhuList.reduce((acc, curr) => ({ ...acc, [curr]: '8.800' }), {});
      setServiceFees(defaultFees);
    }
  };

  const handleSaveFees = async () => {
    setIsSavingFees(true);
    try {
      await setDoc(doc(db, 'settings', 'serviceFees'), serviceFees);
      alert('Đã cập nhật bảng phí dịch vụ thành công!');
    } catch (error) {
      alert('Lỗi khi lưu phí dịch vụ!');
    }
    setIsSavingFees(false);
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleImageChange = (e) => { if (e.target.files) setImages(Array.from(e.target.files)); };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa căn hộ này không?')) {
      await deleteDoc(doc(db, 'properties', id));
      alert('Đã xóa thành công!');
      fetchProperties();
    }
  };

  const handleEdit = (item) => {
    setFormData({ ...initialForm, ...item });
    setEditingId(item.id);
    setImages([]);
    window.scrollTo(0, 0);
  };

  // Hàm tự tạo mã căn
  const generateMaCan = (type) => {
    const prefix = type === 'Cho thuê' ? 'CT' : 'CN';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0 && !editingId) return alert('Vui lòng chọn ít nhất 1 ảnh!');
    setIsUploading(true);
    
    try {
      let imageUrls = editingId ? formData.images : []; 
      
      if (images.length > 0) {
        imageUrls = [];
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

      // Giữ nguyên mã căn cũ nếu đang sửa, hoặc tạo mới nếu đăng mới
      const finalMaCan = editingId ? formData.maCan : generateMaCan(formData.listingType);

      const dataToSave = {
        ...formData,
        maCan: finalMaCan,
        price: Number(formData.price),
        area: Number(formData.area),
        images: imageUrls,
      };

      if (editingId) {
        await updateDoc(doc(db, 'properties', editingId), dataToSave);
        alert('Cập nhật thông tin thành công!');
      } else {
        await addDoc(collection(db, 'properties'), { ...dataToSave, createdAt: serverTimestamp() });
        alert(`Đã đăng thành công căn ${formData.listingType} với Mã: ${finalMaCan}`);
      }

      setFormData(initialForm);
      setEditingId(null);
      setImages([]);
      fetchProperties();
    } catch (error) {
      console.error('Lỗi:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
    setIsUploading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-50">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Mật khẩu Quản trị</h2>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') document.getElementById('btnLogin').click()}} className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
          <button id="btnLogin" onClick={() => { if(password === '0912791925') setIsAuthenticated(true); else alert('Sai mật khẩu!'); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold transition shadow-md">Truy cập</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-gray-900 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        
        {/* KHỐI 1: CÀI ĐẶT PHÍ DỊCH VỤ */}
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md border-t-4 border-orange-500">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-gray-800">Cài đặt Phí dịch vụ (VNĐ/m²)</h2>
             <button onClick={handleSaveFees} disabled={isSavingFees} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-bold shadow-sm disabled:opacity-50 transition">
               {isSavingFees ? 'Đang lưu...' : 'Lưu bảng phí'}
             </button>
           </div>
           <p className="text-xs text-gray-500 mb-4">Cập nhật phí tại đây, tất cả các căn hộ trên web sẽ tự động hiển thị phí mới tương ứng với phân khu của nó.</p>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
             {phanKhuList.map(pk => (
               <div key={pk} className="border border-gray-200 rounded p-2 bg-gray-50">
                 <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">{pk}</label>
                 <input type="text" value={serviceFees[pk] || ''} onChange={(e) => setServiceFees({...serviceFees, [pk]: e.target.value})} className="w-full p-1.5 text-sm border rounded outline-none focus:border-orange-500" placeholder="VD: 8.800" />
               </div>
             ))}
           </div>
        </div>

        {/* KHỐI 2: FORM THÊM/SỬA CĂN HỘ */}
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md border-t-4 border-blue-600">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
             <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
               {editingId ? `Sửa thông tin: ${formData.maCan}` : 'Đăng tin Bất động sản'}
             </h1>
             {editingId && (
               <button onClick={() => {setEditingId(null); setFormData(initialForm);}} className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md font-semibold transition">Hủy sửa / Tạo mới</button>
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
                <label className="block text-sm font-semibold mb-1 text-gray-600">Phân khu (Để tự tính phí DV)</label>
                <select name="phanKhu" value={formData.phanKhu} onChange={handleInputChange} className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                  {phanKhuList.map(opt => <option key={opt}>{opt}</option>)}
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

            {/* Khối nhập liệu riêng cho Cho Thuê */}
            {formData.listingType === 'Cho thuê' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-semibold mb-1 text-blue-800">Ngày nhận nhà (Cho thuê)</label>
                <input type="date" name="ngayNhanNha" value={formData.ngayNhanNha || ''} onChange={handleInputChange} className="w-full md:w-1/2 p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            )}

            {/* Mô tả tùy chỉnh */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-600">Mô tả bổ sung (Mục Khác)</label>
              <textarea name="moTa" value={formData.moTa || ''} onChange={handleInputChange} rows="3" placeholder="Nhập thêm ghi chú (Ví dụ: Bao phí quản lý, ưu tiên nữ... Bỏ trống nếu không có)" className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              <p className="text-xs text-gray-500 mt-1">Các thông tin cơ bản như Giá, Nội thất, Hợp đồng... hệ thống sẽ tự động tạo theo định dạng chuẩn. Bạn chỉ cần nhập những yêu cầu đặc biệt vào đây.</p>
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

        {/* KHỐI 3: DANH SÁCH CĂN ĐANG ĐĂNG CÓ TÌM KIẾM THEO MÃ CĂN */}
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
            <h2 className="text-xl font-bold text-gray-800">Danh sách hiển thị ({properties.length})</h2>
            
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="Tìm mã căn (VD: CT123), tòa nhà..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 border-b">Mã căn</th>
                  <th className="p-3 border-b">Tòa</th>
                  <th className="p-3 border-b">Loại căn</th>
                  <th className="p-3 border-b">Giá</th>
                  <th className="p-3 border-b text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {properties
                  .filter(item => 
                    item.maCan?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    item.toaNha?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    item.phanKhu?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3">
                      <span className="font-bold text-blue-800 tracking-wide">{item.maCan}</span>
                      <span className="text-[10px] text-gray-500 block uppercase mt-0.5">{item.listingType}</span>
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
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}