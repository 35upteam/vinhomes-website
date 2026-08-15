'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [dbPassword, setDbPassword] = useState('0912791925'); 

  useEffect(() => {
    const fetchAuth = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'adminAuth'));
      if (docSnap.exists()) setDbPassword(docSnap.data().password);
    };
    fetchAuth();
  }, []);

  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [pwdData, setPwdData] = useState({ old: '', new: '', confirm: '' });
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const phanKhuList = ['Sapphire', 'Miami', 'Sakura', 'Victoria', 'Imperia', 'Sola Park', 'Tonkin', 'Canopy', 'Masteri West Height', 'Lumiere Evergreen'];
  const [serviceFees, setServiceFees] = useState({});
  const [tempServiceFees, setTempServiceFees] = useState({});
  const [isSavingFees, setIsSavingFees] = useState(false);

  const initialForm = { listingType: 'Cho thuê', phanKhu: 'Sapphire', loaiCan: 'Studio', toaNha: '', khoangTang: 'Tầng trung', huongBanCong: 'Đông Nam', noiThat: 'Đầy đủ nội thất', area: '', price: '', ngayNhanNha: '', moTa: '' };
  const [formData, setFormData] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [adminTab, setAdminTab] = useState('quy-can');
  const [properties, setProperties] = useState([]);
  const [kyGuiList, setKyGuiList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterType, setFilterType] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isAuthenticated) {
      fetchProperties();
      fetchServiceFees();
      fetchKyGui();
    }
  }, [isAuthenticated]);

  const fetchProperties = async () => {
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setProperties(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchKyGui = async () => {
    const q = query(collection(db, 'ky_gui'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setKyGuiList(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchServiceFees = async () => {
    const feeDoc = await getDoc(doc(db, 'settings', 'serviceFees'));
    if (feeDoc.exists()) setServiceFees(feeDoc.data());
    else {
      const defaultFees = phanKhuList.reduce((acc, curr) => ({ ...acc, [curr]: '8.800' }), {});
      setServiceFees(defaultFees);
    }
  };

  const openFeeModal = () => { setTempServiceFees(serviceFees); setIsFeeModalOpen(true); };
  const handleSaveFees = async () => {
    setIsSavingFees(true);
    try {
      await setDoc(doc(db, 'settings', 'serviceFees'), tempServiceFees);
      setServiceFees(tempServiceFees);
      alert('Đã cập nhật bảng phí dịch vụ thành công!');
      setIsFeeModalOpen(false);
    } catch (error) { alert('Lỗi khi lưu phí dịch vụ!'); }
    setIsSavingFees(false);
  };

  const handleChangePassword = async () => {
    if (pwdData.old !== dbPassword) return alert('Mật khẩu cũ không chính xác!');
    if (pwdData.new !== pwdData.confirm) return alert('Mật khẩu mới không khớp!');
    if (pwdData.new.length < 6) return alert('Mật khẩu phải từ 6 ký tự!');
    try {
      await setDoc(doc(db, 'settings', 'adminAuth'), { password: pwdData.new });
      setDbPassword(pwdData.new);
      alert('Đổi mật khẩu thành công!');
      setIsPwdModalOpen(false);
      setPwdData({ old: '', new: '', confirm: '' });
    } catch (error) { alert('Lỗi khi đổi mật khẩu!'); }
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

  const toggleKyGuiStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Chưa xử lý' ? 'Đã liên hệ' : 'Chưa xử lý';
    await updateDoc(doc(db, 'ky_gui', id), { status: newStatus });
    fetchKyGui();
  };

  const handleDeleteKyGui = async (id) => {
    if (window.confirm('Xóa thông tin ký gửi này khỏi danh sách?')) {
      await deleteDoc(doc(db, 'ky_gui', id));
      fetchKyGui();
    }
  };

  const generateMaCan = (type) => {
    const prefix = type === 'Cho thuê' ? 'CT' : 'CN';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
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
      const dataToSave = { ...formData, maCan: finalMaCan, price: Number(formData.price), area: Number(formData.area), images: imageUrls };

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
    } catch (error) { alert('Có lỗi xảy ra, vui lòng thử lại!'); }
    setIsUploading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans relative" style={{ backgroundColor: '#111827' }}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 backdrop-blur-md bg-blue-900/40"></div>
        
        <div className="relative z-10 bg-white/95 backdrop-blur-xl p-10 rounded-[24px] shadow-2xl text-center max-w-[400px] w-full mx-4 border border-white/40">
          <img src="/logo.png" alt="Logo Quỹ Căn Smart City" className="h-14 mx-auto mb-5 object-contain" />
          <h2 className="text-[22px] font-bold mb-1 text-blue-900 uppercase tracking-widest">Hệ thống Quản trị</h2>
          <p className="text-sm text-gray-500 mb-8 font-medium">Bảng điều khiển nội bộ</p>
          
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') document.getElementById('btnLogin').click()}} className="w-full p-4 border border-gray-300 rounded-xl mb-6 text-center text-2xl tracking-[0.3em] focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition font-black text-blue-900 bg-white/50" placeholder="••••••••" />
          <button id="btnLogin" onClick={() => { if(password === dbPassword) setIsAuthenticated(true); else alert('Sai mật khẩu!'); }} className="w-full bg-blue-700 hover:bg-blue-800 text-white p-4 rounded-xl font-bold text-lg transition shadow-xl shadow-blue-700/30">Đăng Nhập Dashboard</button>
        </div>
      </div>
    );
  }

  const countAll = properties.length;
  const countThu = properties.filter(p => p.listingType === 'Cho thuê').length;
  const countBan = properties.filter(p => p.listingType === 'Chuyển nhượng').length;

  const filteredProperties = properties.filter(item => {
    const matchSearch = item.maCan?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.toaNha?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.phanKhu?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'Tất cả' || item.listingType === filterType;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const unreadKyGuiCount = kyGuiList.filter(k => k.status === 'Chưa xử lý').length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      <nav className="bg-blue-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <Link href="/" className="bg-white rounded-lg p-1.5 h-10 flex items-center justify-center shadow-inner">
               <img src="/logo.png" alt="Logo" className="h-full object-contain" />
             </Link>
             <h1 className="font-bold text-base tracking-wider hidden sm:block">ADMIN DASHBOARD</h1>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={() => setIsPwdModalOpen(true)} className="bg-white/10 hover:bg-white/20 border border-white/30 px-4 py-2 rounded-lg text-sm font-medium transition">Đổi mật khẩu</button>
            <button onClick={openFeeModal} className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-md">Phí dịch vụ</button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-8 flex flex-col xl:flex-row gap-8 items-start">
        <div className="w-full xl:w-[35%] flex-shrink-0 bg-white p-6 md:p-8 rounded-2xl shadow-sm shadow-gray-200/50 border border-gray-100">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
             <div>
               <h2 className="text-xl font-bold text-blue-900 tracking-tight">{editingId ? 'Sửa thông tin căn hộ' : 'Lên giỏ hàng mới'}</h2>
               {editingId && <p className="text-blue-600 font-bold mt-1 text-sm">Đang sửa mã: {formData.maCan}</p>}
             </div>
             {editingId && <button onClick={() => {setEditingId(null); setFormData(initialForm);}} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-bold transition">Hủy sửa</button>}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="listingType" value="Cho thuê" checked={formData.listingType === 'Cho thuê'} onChange={handleInputChange} className="hidden peer" />
                <div className="text-center py-2.5 rounded-lg peer-checked:bg-white peer-checked:text-blue-600 peer-checked:shadow-sm font-bold text-gray-500 transition text-sm">Cho Thuê</div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="listingType" value="Chuyển nhượng" checked={formData.listingType === 'Chuyển nhượng'} onChange={handleInputChange} className="hidden peer" />
                <div className="text-center py-2.5 rounded-lg peer-checked:bg-white peer-checked:text-blue-600 peer-checked:shadow-sm font-bold text-gray-500 transition text-sm">Chuyển Nhượng</div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Phân khu</label>
                <select name="phanKhu" value={formData.phanKhu} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium">{phanKhuList.map(opt => <option key={opt}>{opt}</option>)}</select>
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Tòa nhà (VD: S1.02)</label>
                <input name="toaNha" value={formData.toaNha} onChange={handleInputChange} placeholder="Nhập tên tòa..." className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium" required />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Loại căn</label>
                <select name="loaiCan" value={formData.loaiCan} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium">{['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(opt => <option key={opt}>{opt}</option>)}</select>
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Khoảng tầng</label>
                <select name="khoangTang" value={formData.khoangTang} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium">{['Tầng thấp', 'Tầng trung', 'Tầng cao'].map(opt => <option key={opt}>{opt}</option>)}</select>
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Hướng</label>
                <select name="huongBanCong" value={formData.huongBanCong} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium">{['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'].map(opt => <option key={opt}>{opt}</option>)}</select>
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Nội thất</label>
                <select name="noiThat" value={formData.noiThat} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium">{['Nguyên bản CĐT', 'Đồ cơ bản', 'Đầy đủ nội thất'].map(opt => <option key={opt}>{opt}</option>)}</select>
              </div>
               <div>
                  <label className="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Diện tích (m²)</label>
                  <input name="area" value={formData.area} onChange={handleInputChange} type="number" step="0.1" placeholder="Nhập số" className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium" required />
               </div>
               <div>
                  <label className="block text-[11px] font-bold mb-1 text-gray-500 uppercase">{formData.listingType === 'Cho thuê' ? 'Giá thuê (Triệu)' : 'Giá bán (Tỷ)'}</label>
                  <input name="price" value={formData.price} onChange={handleInputChange} type="number" step="0.01" placeholder="VD: 15.5" className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium" required />
               </div>
            </div>

            {formData.listingType === 'Cho thuê' && (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="block text-[11px] font-bold mb-1 text-blue-800 uppercase">Ngày nhận nhà</label>
                <input type="date" name="ngayNhanNha" value={formData.ngayNhanNha || ''} onChange={handleInputChange} className="w-full p-3 border border-blue-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium" />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold mb-1.5 text-gray-500 uppercase">Ghi chú mật (Chỉ lưu nội bộ)</label>
              <textarea name="moTa" value={formData.moTa || ''} onChange={handleInputChange} rows="2" placeholder="VD: Pass cửa, thông tin chủ nhà, % hoa hồng..." className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium"></textarea>
            </div>

            <div className="border-2 border-dashed border-gray-300 p-5 text-center rounded-xl bg-gray-50 hover:bg-gray-100 transition">
              <label className="block font-bold mb-2 cursor-pointer text-blue-900 text-sm">Tải lên Ảnh căn hộ</label>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
              {images.length > 0 && <p className="text-sm text-blue-600 mt-3 font-bold">Đã chọn {images.length} ảnh mới</p>}
            </div>

            <button type="submit" disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold text-base transition shadow-lg shadow-blue-600/30 disabled:bg-gray-400 mt-2">
               {isUploading ? 'Đang tải dữ liệu...' : (editingId ? 'CẬP NHẬT THÔNG TIN' : `ĐĂNG CĂN ${formData.listingType.toUpperCase()}`)}
            </button>
          </form>
        </div>

        <div className="flex-1 w-full bg-white p-6 md:p-8 rounded-2xl shadow-sm shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="flex gap-6 mb-6 border-b border-gray-100">
            <button onClick={() => setAdminTab('quy-can')} className={`font-bold pb-3 border-b-2 transition ${adminTab === 'quy-can' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Quỹ căn đang đăng ({properties.length})
            </button>
            <button onClick={() => setAdminTab('ky-gui')} className={`font-bold pb-3 border-b-2 transition flex items-center gap-2 ${adminTab === 'ky-gui' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Khách Ký Gửi
              {unreadKyGuiCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse">{unreadKyGuiCount} mới</span>}
            </button>
          </div>

          <div className="mb-6">
            <input 
              type="text" 
              placeholder={adminTab === 'quy-can' ? "Tìm mã căn, tòa nhà..." : "Tìm SĐT, tòa nhà khách gửi..."}
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="w-full max-w-sm px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
            />
          </div>

          <div className="overflow-x-auto">
            {adminTab === 'quy-can' ? (
              <>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg min-w-[120px]">
                        <div className="flex flex-col gap-1 items-start">
                          <span>Mã căn</span>
                          <select value={filterType} onChange={(e) => {setFilterType(e.target.value); setCurrentPage(1);}} className="text-[10px] p-1 rounded-md border border-gray-300 font-bold outline-none focus:border-blue-500 bg-white cursor-pointer w-full text-gray-700">
                            <option value="Tất cả">Tất cả ({countAll})</option>
                            <option value="Cho thuê">Cho thuê ({countThu})</option>
                            <option value="Chuyển nhượng">Chuyển nhượng ({countBan})</option>
                          </select>
                        </div>
                      </th>
                      <th className="px-4 py-3">Tòa / Phân khu</th>
                      <th className="px-4 py-3">Loại / Giá</th>
                      <th className="px-4 py-3">Ghi chú mật</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedProperties.map(item => {
                      // XỬ LÝ NGÀY ĐĂNG
                      let dateStr = 'Đang cập nhật';
                      if (item.createdAt?.seconds) {
                        const d = new Date(item.createdAt.seconds * 1000);
                        dateStr = `Ngày đăng: ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                      }

                      return (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition group">
                        <td className="px-4 py-4">
                          <Link href={`/property/${item.id}`} target="_blank" className="font-extrabold text-blue-900 hover:text-blue-600 hover:underline tracking-wide text-sm block" title="Mở sang tab mới để xem">
                            {item.maCan} <svg className="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </Link>
                          {/* ĐỔI LOẠI CĂN THÀNH NGÀY ĐĂNG NHƯ YÊU CẦU */}
                          <span className="text-[10px] text-gray-500 font-semibold">{dateStr}</span>
                        </td>
                        <td className="px-4 py-4"><span className="font-bold text-gray-800 block">Tòa {item.toaNha || item.building}</span><span className="text-[11px] text-gray-500 font-medium">{item.phanKhu}</span></td>
                        <td className="px-4 py-4">
                           <span className="font-semibold text-gray-600 block text-xs">{item.loaiCan || item.type}</span>
                           <span className="font-black text-blue-700 text-sm">{item.price} {item.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'Tr'}</span>
                        </td>
                        <td className="px-4 py-4 max-w-[150px]">
                           <p className="text-[11px] text-gray-600 line-clamp-2 font-medium" title={item.moTa}>{item.moTa || <span className="text-gray-300 italic">Trống</span>}</p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md font-bold transition">Sửa</button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md font-bold transition">Xóa</button>
                          </div>
                        </td>
                      </tr>
                    )})}
                    {paginatedProperties.length === 0 && <tr><td colSpan="5" className="px-4 py-10 text-center text-gray-400 font-medium">Không tìm thấy dữ liệu.</td></tr>}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className="flex justify-end items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">Trước</button>
                    <span className="text-xs text-gray-500 font-bold bg-gray-50 px-3 py-1.5 rounded-md">Trang {currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">Sau</button>
                  </div>
                )}
              </>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Tòa / Số căn</th>
                    <th className="px-4 py-3">Nhu cầu</th>
                    <th className="px-4 py-3">SĐT Khách</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kyGuiList.filter(item => item.soDienThoai?.includes(searchTerm) || item.toaNha?.toLowerCase().includes(searchTerm.toLowerCase())).map(item => {
                    let d = new Date();
                    if (item.createdAt?.seconds) d = new Date(item.createdAt.seconds * 1000);
                    const dateStr = `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                    return (
                      <tr key={item.id} className={`hover:bg-blue-50/30 transition group ${item.status === 'Chưa xử lý' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-4"><span className="font-bold text-gray-900 block">{item.toaNha} - Căn {item.soCan}</span><span className="text-[10px] text-gray-500 font-medium">Gửi lúc: {dateStr}</span></td>
                        <td className="px-4 py-4"><span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.nhuCau === 'Cho thuê' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{item.nhuCau}</span><span className="block text-xs font-black text-gray-800 mt-1">{item.gia} {item.nhuCau === 'Cho thuê' ? 'Tr' : 'Tỷ'}</span></td>
                        <td className="px-4 py-4 font-bold text-blue-600">{item.soDienThoai}</td>
                        <td className="px-4 py-4"><button onClick={() => toggleKyGuiStatus(item.id, item.status)} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${item.status === 'Chưa xử lý' ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'}`}>{item.status} (Click đổi)</button></td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setAdminTab('quy-can'); setFormData({ ...initialForm, listingType: item.nhuCau, toaNha: item.toaNha, loaiCan: item.loaiCan, area: item.dienTich, price: item.gia.replace(/[^0-9.]/g, ''), noiThat: item.noiThat, ngayNhanNha: item.ngayVaoO || '', moTa: `Khách ký gửi: SĐT ${item.soDienThoai}. Ghi chú khách: ${item.ghiChu}` }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md font-bold transition">Lên bài</button>
                            <button onClick={() => handleDeleteKyGui(item.id)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md font-bold transition">Xóa</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {isFeeModalOpen && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="text-xl font-bold text-blue-900">Bảng Phí Dịch Vụ</h2></div>
              <button onClick={() => setIsFeeModalOpen(false)} className="text-gray-400 hover:text-red-500">X</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {phanKhuList.map(pk => (
                <div key={pk} className="border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus-within:border-blue-500"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{pk}</label><input type="text" value={tempServiceFees[pk] || ''} onChange={(e) => setTempServiceFees({...tempServiceFees, [pk]: e.target.value})} className="w-full bg-transparent text-sm font-bold text-blue-900 outline-none" /></div>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5"><button onClick={() => setIsFeeModalOpen(false)} className="px-6 py-2.5 rounded-lg text-gray-600 font-bold hover:bg-gray-100">Hủy</button><button onClick={handleSaveFees} disabled={isSavingFees} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md disabled:opacity-50">Lưu bảng phí</button></div>
          </div>
        </div>
      )}

      {isPwdModalOpen && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-sm">
            <h2 className="text-xl font-bold text-blue-900 mb-6">Đổi Mật Khẩu Admin</h2>
            <div className="space-y-4 mb-6">
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Mật khẩu cũ</label><input type="password" value={pwdData.old} onChange={e => setPwdData({...pwdData, old: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Mật khẩu mới</label><input type="password" value={pwdData.new} onChange={e => setPwdData({...pwdData, new: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Nhập lại</label><input type="password" value={pwdData.confirm} onChange={e => setPwdData({...pwdData, confirm: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:border-blue-500" /></div>
            </div>
            <div className="flex justify-end gap-3"><button onClick={() => setIsPwdModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Hủy</button><button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold">Cập nhật</button></div>
          </div>
        </div>
      )}
    </div>
  );
}