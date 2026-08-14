'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Trạng thái cho Pop-up Cài đặt phí
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
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
      setIsFeeModalOpen(false); // Đóng pop-up khi lưu xong
    } catch (error) {
      alert('Lỗi khi lưu phí dịch vụ!');
    }
    setIsSavingFees(false);
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleImageChange = (e) => { if (e.target.files) setImages(Array.from(e.target.files)); };

  const handleDelete = async (id) => {
    if (window.confirm('Cảnh báo: Bạn có chắc chắn muốn xóa căn hộ này khỏi hệ thống?')) {
      await deleteDoc(doc(db, 'properties', id));
      alert('Đã xóa thành công!');
      fetchProperties();
    }
  };

  const handleEdit = (item) => {
    setFormData({ ...initialForm, ...item });
    setEditingId(item.id);
    setImages([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // ----------------------------------------------------
  // GIAO DIỆN KHÓA ĐĂNG NHẬP
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border-t-4 border-blue-900">
          <div className="w-20 h-20 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <svg viewBox="0 0 24 24" className="w-12 h-12">
               <path fill="currentColor" d="M12 2L1 12h3v9h16v-9h3L12 2z"/>
             </svg>
          </div>
          <h2 className="text-2xl font-extrabold mb-2 text-blue-900 uppercase tracking-wider">Hệ thống Quản trị</h2>
          <p className="text-sm text-gray-500 mb-8">Quỹ Căn Smart City</p>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') document.getElementById('btnLogin').click()}} className="w-full p-4 border border-gray-200 rounded-xl mb-6 text-center text-xl tracking-[0.3em] focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition" placeholder="••••••••" />
          <button id="btnLogin" onClick={() => { if(password === '0912791925') setIsAuthenticated(true); else alert('Sai mật khẩu!'); }} className="w-full bg-blue-900 hover:bg-blue-800 text-white p-4 rounded-xl font-bold text-lg transition shadow-lg">Truy cập Dashboard</button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // GIAO DIỆN DASHBOARD CHÍNH
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-12">
      
      {/* Navbar Admin */}
      <nav className="bg-blue-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 flex items-center justify-center bg-white rounded p-1">
               <svg viewBox="0 0 24 24" className="w-full h-full"><path fill="#1e3a8a" d="M12 2L1 12h3v9h16v-9h3L12 2z"/></svg>
             </div>
             <h1 className="font-bold text-lg tracking-wider hidden sm:block">ADMIN DASHBOARD</h1>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={() => setIsFeeModalOpen(true)} className="bg-white/10 hover:bg-white/20 border border-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Cập nhật Phí dịch vụ
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-8 flex flex-col xl:flex-row gap-8 items-start">
        
        {/* CỘT TRÁI: FORM ĐĂNG BÀI */}
        <div className="w-full xl:w-[45%] flex-shrink-0 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
             <div>
               <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight">
                 {editingId ? 'Sửa thông tin căn hộ' : 'Lên giỏ hàng mới'}
               </h2>
               {editingId && <p className="text-orange-600 font-bold mt-1 text-sm">Đang sửa mã: {formData.maCan}</p>}
             </div>
             {editingId && (
               <button onClick={() => {setEditingId(null); setFormData(initialForm);}} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold transition">Hủy sửa</button>
             )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Toggle Thuê/Bán */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="listingType" value="Cho thuê" checked={formData.listingType === 'Cho thuê'} onChange={handleInputChange} className="hidden peer" />
                <div className="text-center py-2.5 rounded-lg peer-checked:bg-white peer-checked:text-orange-600 peer-checked:shadow-sm font-bold text-gray-500 transition">Cho Thuê</div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="listingType" value="Chuyển nhượng" checked={formData.listingType === 'Chuyển nhượng'} onChange={handleInputChange} className="hidden peer" />
                <div className="text-center py-2.5 rounded-lg peer-checked:bg-white peer-checked:text-blue-600 peer-checked:shadow-sm font-bold text-gray-500 transition">Chuyển Nhượng</div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">Phân khu</label>
                <select name="phanKhu" value={formData.phanKhu} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium">
                  {phanKhuList.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">Tòa nhà (VD: S1.02)</label>
                <input name="toaNha" value={formData.toaNha} onChange={handleInputChange} placeholder="Nhập tên tòa..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium" required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">Loại căn</label>
                <select name="loaiCan" value={formData.loaiCan} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium">
                  {['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">Khoảng tầng</label>
                <select name="khoangTang" value={formData.khoangTang} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium">
                  {['Tầng thấp', 'Tầng trung', 'Tầng cao'].map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">Hướng ban công</label>
                <select name="huongBanCong" value={formData.huongBanCong} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium">
                  {['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'].map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">Nội thất</label>
                <select name="noiThat" value={formData.noiThat} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium">
                  {['Nguyên bản CĐT', 'Đồ cơ bản', 'Đầy đủ nội thất'].map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
               <div>
                  <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">Diện tích (m²)</label>
                  <input name="area" value={formData.area} onChange={handleInputChange} type="number" step="0.1" placeholder="Nhập số" className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium" required />
               </div>
               <div>
                  <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">
                    {formData.listingType === 'Cho thuê' ? 'Giá thuê (Triệu)' : 'Giá bán (Tỷ)'}
                  </label>
                  <input name="price" value={formData.price} onChange={handleInputChange} type="number" step="0.01" placeholder="VD: 15.5" className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium" required />
               </div>
            </div>

            {formData.listingType === 'Cho thuê' && (
              <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                <label className="block text-xs font-bold mb-1 text-orange-700 uppercase">Ngày nhận nhà</label>
                <input type="date" name="ngayNhanNha" value={formData.ngayNhanNha || ''} onChange={handleInputChange} className="w-full p-2.5 border border-orange-200 rounded-lg focus:border-orange-500 outline-none text-sm" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase">Mô tả bổ sung</label>
              <textarea name="moTa" value={formData.moTa || ''} onChange={handleInputChange} rows="3" placeholder="Nhập các ghi chú đặc biệt..." className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"></textarea>
            </div>

            <div className="border-2 border-dashed border-gray-300 p-5 text-center rounded-xl bg-gray-50 hover:bg-gray-100 transition">
              <label className="block font-bold mb-2 cursor-pointer text-blue-900 text-sm">Tải lên Ảnh căn hộ</label>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
              <p className="text-[10px] text-gray-400 mt-2">Bỏ trống nếu muốn giữ ảnh cũ khi đang sửa</p>
              {images.length > 0 && <p className="text-sm text-orange-600 mt-2 font-bold">Đã chọn {images.length} ảnh mới</p>}
            </div>

            <button type="submit" disabled={isUploading} className={`w-full text-white p-4 rounded-xl font-extrabold text-lg transition shadow-md ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-900 hover:bg-blue-800'} disabled:bg-gray-400 disabled:shadow-none`}>
               {isUploading ? 'Đang tải dữ liệu...' : (editingId ? 'CẬP NHẬT THÔNG TIN' : `ĐĂNG CĂN ${formData.listingType.toUpperCase()}`)}
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: QUẢN LÝ QUỸ CĂN */}
        <div className="flex-1 w-full bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-100 gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight">Quản lý quỹ căn</h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">Tổng số: {properties.length} căn hộ trên hệ thống</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="Tìm mã căn, tòa nhà, phân khu..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
              <svg className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Mã căn</th>
                  <th className="px-4 py-3">Tòa / Phân khu</th>
                  <th className="px-4 py-3">Loại căn</th>
                  <th className="px-4 py-3 text-right">Giá</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties
                  .filter(item => 
                    item.maCan?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    item.toaNha?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    item.phanKhu?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition group">
                    <td className="px-4 py-4">
                      <span className="font-extrabold text-blue-900 tracking-wide text-sm block">{item.maCan}</span>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.listingType === 'Cho thuê' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.listingType}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-gray-800 block">Tòa {item.toaNha || item.building}</span>
                      <span className="text-xs text-gray-500">{item.phanKhu}</span>
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-700">{item.loaiCan || item.type}</td>
                    <td className="px-4 py-4 text-right font-extrabold text-orange-600 text-base">{item.price} <span className="text-xs font-medium text-gray-500">{item.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'Tr'}</span></td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition" title="Sửa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition" title="Xóa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {properties.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-10 text-center text-gray-400 font-medium">Chưa có quỹ căn nào trong hệ thống.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* POP-UP MODAL CÀI ĐẶT PHÍ DỊCH VỤ */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-blue-900">Bảng Phí Dịch Vụ</h2>
                <p className="text-sm text-gray-500 mt-1">Hệ thống sẽ tự động hiển thị phí tương ứng lên thông tin căn hộ.</p>
              </div>
              <button onClick={() => setIsFeeModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {phanKhuList.map(pk => (
                <div key={pk} className="border border-gray-200 rounded-xl p-3 bg-gray-50 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition">
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">{pk}</label>
                  <input type="text" value={serviceFees[pk] || ''} onChange={(e) => setServiceFees({...serviceFees, [pk]: e.target.value})} className="w-full bg-transparent text-sm font-bold text-blue-900 outline-none" placeholder="VD: 8.800" />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => setIsFeeModalOpen(false)} className="px-5 py-2.5 rounded-lg text-gray-600 font-bold hover:bg-gray-100 transition">Hủy</button>
              <button onClick={handleSaveFees} disabled={isSavingFees} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-md disabled:opacity-50 transition">
                {isSavingFees ? 'Đang lưu hệ thống...' : 'Lưu bảng phí'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}