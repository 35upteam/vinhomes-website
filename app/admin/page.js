'use client';
import { useState, useEffect } from 'react';
import { db, auth, provider } from '../../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import Link from 'next/link';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const defaultPkConfig = {
    "Sapphire": { phi: "8.800 VNĐ/m2", tongQuan: "", uuDiem: "", tienIch: "", images: [] },
    "Miami": { phi: "8.800 VNĐ/m2", tongQuan: "", uuDiem: "", tienIch: "", images: [] },
    "Sakura": { phi: "8.800 VNĐ/m2", tongQuan: "", uuDiem: "", tienIch: "", images: [] },
    "Victoria": { phi: "12.000 VNĐ/m2", tongQuan: "", uuDiem: "", tienIch: "", images: [] },
    "Imperia": { phi: "11.000 VNĐ/m2", tongQuan: "", uuDiem: "", tienIch: "", images: [] },
    "Sola Park": { phi: "10.000 VNĐ/m2", tongQuan: "", uuDiem: "", tienIch: "", images: [] },
    "Tonkin": { phi: "16.500 VNĐ/m2", tongQuan: "", uuDiem: "", tienIch: "", images: [] },
    "Canopy": { phi: "12.000 VNĐ/m2", tongQuan: "", uuDiem: "", tienIch: "", images: [] },
    "Masteri West Height": { phi: "18.000 VNĐ/m2", tongQuan: "", uuDiem: "", tienIch: "", images: [] },
    "Lumiere Evergreen": { phi: "18.000 VNĐ/m2", tongQuan: "", uuDiem: "", tienIch: "", images: [] }
  };

  const [isPhanKhuModalOpen, setIsPhanKhuModalOpen] = useState(false);
  const phanKhuList = ['Sapphire', 'Miami', 'Sakura', 'Victoria', 'Imperia', 'Sola Park', 'Tonkin', 'Canopy', 'Masteri West Height', 'Lumiere Evergreen'];
  const [phanKhuData, setPhanKhuData] = useState({});
  const [selectedPK, setSelectedPK] = useState('Sapphire');
  const [tempPKData, setTempPKData] = useState({ phi: '', tongQuan: '', uuDiem: '', tienIch: '', images: [], localImages: [] });
  const [isSavingPK, setIsSavingPK] = useState(false);

  const initialForm = { listingType: 'Cho thuê', phanKhu: 'Sapphire', loaiCan: 'Studio', toaNha: '', khoangTang: 'Tầng trung', huongBanCong: 'Đông Nam', noiThat: 'Đầy đủ nội thất', area: '', price: '', ngayNhanNha: '', vaoLuon: false, phapLy: 'Sổ đỏ', moTa: '', nhanDan: 'Không có' };
  const [formData, setFormData] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [skipDupCheck, setSkipDupCheck] = useState(false);

  const [adminTab, setAdminTab] = useState('quy-can');
  const [properties, setProperties] = useState([]);
  const [kyGuiList, setKyGuiList] = useState([]);
  const [nhoTimList, setNhoTimList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterType, setFilterType] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, 'settings', 'allowedEmails');
        const docSnap = await getDoc(docRef);
        let emails = [];
        if (docSnap.exists()) emails = docSnap.data().emails || [];
        else { emails = [currentUser.email]; await setDoc(docRef, { emails }); }

        if (emails.includes(currentUser.email)) {
          setUser(currentUser); setIsAuthorized(true); setAllowedEmails(emails);
          fetchProperties(); fetchPhanKhu(); fetchKyGui(); fetchNhoTim();
        } else {
          await signOut(auth); alert("Tài khoản Gmail của bạn không có quyền truy cập trang Quản trị!");
        }
      } else { setUser(null); setIsAuthorized(false); }
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => { try { await signInWithPopup(auth, provider); } catch (error) { alert(`Đăng nhập thất bại: ${error.message}`); } };
  const handleLogout = async () => { await signOut(auth); };

  const handleAddEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) return alert("Email không hợp lệ!");
    if (allowedEmails.includes(newEmail)) return alert("Email này đã có quyền rồi!");
    const updatedEmails = [...allowedEmails, newEmail];
    await setDoc(doc(db, 'settings', 'allowedEmails'), { emails: updatedEmails });
    setAllowedEmails(updatedEmails); setNewEmail(''); alert("Đã cấp quyền truy cập thành công!");
  };

  const handleRemoveEmail = async (emailToRemove) => {
    if (emailToRemove === user.email) return alert("Bạn không thể tự xóa chính mình!");
    if (window.confirm(`Thu hồi quyền truy cập của ${emailToRemove}?`)) {
      const updatedEmails = allowedEmails.filter(e => e !== emailToRemove);
      await setDoc(doc(db, 'settings', 'allowedEmails'), { emails: updatedEmails });
      setAllowedEmails(updatedEmails);
    }
  };

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
  const fetchNhoTim = async () => {
    const q = query(collection(db, 'nho_tim_can'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setNhoTimList(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchPhanKhu = async () => {
    const pkDoc = await getDoc(doc(db, 'settings', 'phanKhuConfig'));
    let dbData = pkDoc.exists() ? pkDoc.data() : {};
    const mergedData = {};
    let needsUpdate = false;
    phanKhuList.forEach(pk => {
      if (dbData[pk] && dbData[pk].phi) mergedData[pk] = dbData[pk];
      else { mergedData[pk] = defaultPkConfig[pk]; needsUpdate = true; }
    });
    setPhanKhuData(mergedData);
    if (needsUpdate) await setDoc(doc(db, 'settings', 'phanKhuConfig'), mergedData);
  };

  const openPhanKhuModal = () => { setTempPKData({...defaultPkConfig[selectedPK], ...phanKhuData[selectedPK], localImages: []}); setIsPhanKhuModalOpen(true); };
  const handleSelectPKChange = (e) => { const val = e.target.value; setSelectedPK(val); setTempPKData({...defaultPkConfig[val], ...phanKhuData[val], localImages: []}); };
  
  const handlePKImageChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newLocal = files.map(f => ({ file: f, url: URL.createObjectURL(f) }));
      setTempPKData(prev => ({...prev, localImages: [...(prev.localImages || []), ...newLocal]}));
    }
  };

  const removePKImage = (index, isLocal) => {
    if(isLocal) {
      const arr = [...tempPKData.localImages]; arr.splice(index, 1);
      setTempPKData(prev => ({...prev, localImages: arr}));
    } else {
      const arr = [...tempPKData.images]; arr.splice(index, 1);
      setTempPKData(prev => ({...prev, images: arr}));
    }
  };

  const handleSavePK = async () => {
    setIsSavingPK(true);
    try {
      let finalImages = [...(tempPKData.images || [])];
      if (tempPKData.localImages && tempPKData.localImages.length > 0) {
        const CLOUD_NAME = "ibzfmsqp"; const UPLOAD_PRESET = "upload preset";
        for (const item of tempPKData.localImages) {
          const data = new FormData(); data.append('file', item.file); data.append('upload_preset', UPLOAD_PRESET);
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
          const uploaded = await res.json(); finalImages.push(uploaded.secure_url);
        }
      }
      
      const updatedItem = { ...tempPKData, images: finalImages };
      delete updatedItem.localImages;
      const updatedData = { ...phanKhuData, [selectedPK]: updatedItem };
      
      await setDoc(doc(db, 'settings', 'phanKhuConfig'), updatedData);
      setPhanKhuData(updatedData);
      setTempPKData({...updatedItem, localImages: []});
      alert('Đã cập nhật thông tin phân khu thành công!');
    } catch (error) { alert('Lỗi khi lưu thông tin phân khu!'); }
    setIsSavingPK(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') setFormData({ ...formData, [name]: checked });
    else if (name === 'listingType' && value === 'Cho thuê' && formData.nhanDan === 'Cắt lỗ') setFormData({ ...formData, listingType: value, nhanDan: 'Không có' });
    else setFormData({ ...formData, [name]: value });
  };
  
  const handleImageChange = async (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const watermarkedFiles = await Promise.all(files.map(addWatermark));
      const newImgs = watermarkedFiles.map(f => ({ file: f, url: URL.createObjectURL(f) }));
      setImages(prev => [...prev, ...newImgs]);
    }
  };

  const setCoverImage = (index) => {
    const arr = [...images];
    const item = arr.splice(index, 1)[0];
    arr.unshift(item);
    setImages(arr);
  };

  const removeImage = (index) => {
    const arr = [...images]; arr.splice(index, 1); setImages(arr);
  };

  const addWatermark = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
          const text = '© Quỹ Căn Smart City - 0912.791.925';
          const fontSize = Math.max(14, Math.floor(img.width * 0.035)); 
          ctx.font = `600 ${fontSize}px Arial`;
          const paddingX = 12; const paddingY = 8;
          const textWidth = ctx.measureText(text).width;
          const rectX = canvas.width - textWidth - paddingX * 2 - 20; const rectY = canvas.height - fontSize - paddingY * 2 - 20;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; ctx.fillRect(rectX, rectY, textWidth + paddingX * 2, fontSize + paddingY * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(text, rectX + paddingX + textWidth / 2, rectY + paddingY + fontSize / 2 + 1);
          canvas.toBlob((blob) => { resolve(new File([blob], file.name, { type: 'image/jpeg' })); }, 'image/jpeg', 0.95);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // HÀM XÓA CĂN HỘ TÍCH HỢP XÓA ẢNH SERVER
  const handleDelete = async (item) => {
    if (window.confirm(`Cảnh báo: Bạn có chắc chắn muốn xóa căn hộ Mã ${item.maCan} khỏi hệ thống? (Hình ảnh cũng sẽ bị xóa vĩnh viễn)`)) {
      try {
        // 1. Dọn rác Cloudinary
        if (item.images && item.images.length > 0) {
          const publicIds = item.images.map(url => {
             const match = url.match(/\/upload\/(?:v\d+\/)?([^.]+)/);
             return match ? match[1] : null;
          }).filter(Boolean);

          if (publicIds.length > 0) {
            await fetch('/api/delete-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicIds })
            });
          }
        }

        // 2. Dọn rác Firebase
        await deleteDoc(doc(db, 'properties', item.id)); 
        sessionStorage.removeItem('cachedProperties'); 
        alert('Đã xóa thành công dữ liệu và dọn sạch hình ảnh!'); 
        fetchProperties();
      } catch (error) {
        alert('Có lỗi xảy ra khi xóa!');
        console.error(error);
      }
    }
  };

  const handleEdit = (item) => {
    setFormData({ ...initialForm, ...item }); setEditingId(item.id); 
    if(item.images) setImages(item.images.map(url => ({ file: null, url })));
    else setImages([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleKyGuiStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Chưa xử lý' ? 'Đã liên hệ' : 'Chưa xử lý';
    await updateDoc(doc(db, 'ky_gui', id), { status: newStatus }); fetchKyGui();
  };
  const toggleNhoTimStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Chưa xử lý' ? 'Đã liên hệ' : 'Chưa xử lý';
    await updateDoc(doc(db, 'nho_tim_can', id), { status: newStatus }); fetchNhoTim();
  };
  const handleDeleteKyGui = async (id) => { if (window.confirm('Xóa thông tin ký gửi này?')) { await deleteDoc(doc(db, 'ky_gui', id)); fetchKyGui(); } };
  const handleDeleteNhoTim = async (id) => { if (window.confirm('Xóa thông tin yêu cầu tìm căn này?')) { await deleteDoc(doc(db, 'nho_tim_can', id)); fetchNhoTim(); } };

  const generateMaCan = (type) => {
    const prefix = type === 'Cho thuê' ? 'CT' : 'CN'; const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let result = '';
    for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length)); return prefix + result;
  };

  const executeSave = async () => {
    setIsUploading(true);
    try {
      let imageUrls = []; 
      const CLOUD_NAME = "ibzfmsqp"; const UPLOAD_PRESET = "upload preset";
      
      for (const img of images) {
        if (img.file) { 
          const data = new FormData(); data.append('file', img.file); data.append('upload_preset', UPLOAD_PRESET);
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
          const uploadedImage = await res.json(); imageUrls.push(uploadedImage.secure_url);
        } else {
          imageUrls.push(img.url);
        }
      }

      const finalMaCan = editingId ? formData.maCan : generateMaCan(formData.listingType);
      const dataToSave = { ...formData, maCan: finalMaCan, price: Number(formData.price), area: Number(formData.area), images: imageUrls };

      if (editingId) {
        await updateDoc(doc(db, 'properties', editingId), dataToSave); alert('Cập nhật thông tin thành công!');
      } else {
        await addDoc(collection(db, 'properties'), { ...dataToSave, createdAt: serverTimestamp() }); alert(`Đã đăng thành công căn ${formData.listingType} với Mã: ${finalMaCan}`);
      }

      sessionStorage.removeItem('cachedProperties'); 
      setFormData(initialForm); setEditingId(null); setImages([]); setSkipDupCheck(false); setDuplicateWarning(null); fetchProperties();
    } catch (error) { alert('Có lỗi xảy ra, vui lòng thử lại!'); }
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();
    if (images.length === 0 && !editingId) return alert('Vui lòng chọn ít nhất 1 ảnh!');
    
    if (!editingId && !skipDupCheck) {
      setIsUploading(true);
      const dupQuery = query(collection(db, 'properties'),
        where('listingType', '==', formData.listingType),
        where('phanKhu', '==', formData.phanKhu),
        where('toaNha', '==', formData.toaNha),
        where('loaiCan', '==', formData.loaiCan),
        where('area', '==', Number(formData.area)),
        where('huongBanCong', '==', formData.huongBanCong)
      );
      const dupSnap = await getDocs(dupQuery);
      setIsUploading(false);
      
      if (!dupSnap.empty) {
        const dupDoc = dupSnap.docs[0];
        setDuplicateWarning({ id: dupDoc.id, maCan: dupDoc.data().maCan });
        return; 
      }
    }
    
    executeSave();
  };

  if (isCheckingAuth) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div></div>;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans relative" style={{ backgroundColor: '#111827' }}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 backdrop-blur-md bg-blue-900/40"></div>
        
        <div className="relative z-10 bg-white/95 backdrop-blur-xl p-10 rounded-[24px] shadow-2xl text-center max-w-[400px] w-full mx-4 border border-white/40">
          <img src="/logo.png" alt="Logo Quỹ Căn Smart City" className="h-14 mx-auto mb-5 object-contain" />
          <h2 className="text-[22px] font-bold mb-1 text-blue-900 uppercase tracking-widest">Hệ Thống Quản Trị</h2>
          <p className="text-sm text-gray-500 mb-8 font-medium">Đăng nhập bằng Gmail nội bộ</p>
          
          <button onClick={handleLogin} className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 p-4 rounded-xl font-bold text-base transition shadow-md flex items-center justify-center gap-3">
             <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
             Tiếp tục với Google
          </button>
          <p className="text-[11px] text-gray-400 mt-6">Chỉ tài khoản được cấp quyền mới có thể truy cập.</p>
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
  const unreadNhoTimCount = nhoTimList.filter(k => k.status === 'Chưa xử lý').length;
  const nhanDanOptions = formData.listingType === 'Chuyển nhượng' ? ['Không có', 'Giá tốt', 'Độc quyền', 'Cắt lỗ'] : ['Không có', 'Giá tốt', 'Độc quyền'];

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12 relative">
      <nav className="bg-blue-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <Link href="/" className="bg-white rounded-lg p-1.5 h-10 flex items-center justify-center shadow-inner"><img src="/logo.png" alt="Logo" className="h-full object-contain" /></Link>
             <h1 className="font-bold text-base tracking-wider hidden sm:block">ADMIN DASHBOARD</h1>
          </div>
          
          <div className="flex gap-3 md:gap-4 items-center">
            <span className="hidden lg:block text-sm font-medium text-blue-100">
              Xin chào <strong className="text-white">{user?.email}</strong>!
            </span>
            <button onClick={openPhanKhuModal} className="bg-white/10 hover:bg-white/20 border border-white/30 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap">
              Quản lý phân khu
            </button>
            <button onClick={() => setIsAccountModalOpen(true)} className="bg-white/10 hover:bg-white/20 border border-white/30 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap">
              Quản lý tài khoản
            </button>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap">
              Đăng xuất
            </button>
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
             {editingId && <button onClick={() => {setEditingId(null); setFormData(initialForm); setImages([]);}} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-bold transition">Hủy sửa</button>}
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

            <div className="flex gap-4">
              {formData.listingType === 'Cho thuê' && (
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex-1">
                  <label className="block text-[11px] font-bold mb-1 text-blue-800 uppercase">Tình trạng vào ở</label>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="date" name="ngayNhanNha" value={formData.ngayNhanNha || ''} onChange={handleInputChange} disabled={formData.vaoLuon} className="flex-1 p-2 border border-blue-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium disabled:opacity-50" />
                    <label className="flex items-center gap-1.5 text-sm font-bold text-blue-900 cursor-pointer whitespace-nowrap">
                      <input type="checkbox" name="vaoLuon" checked={formData.vaoLuon || false} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                      Vào luôn
                    </label>
                  </div>
                </div>
              )}

              {formData.listingType === 'Chuyển nhượng' && (
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex-1">
                  <label className="block text-[11px] font-bold mb-1 text-blue-800 uppercase">Tình trạng pháp lý</label>
                  <select name="phapLy" value={formData.phapLy || 'Sổ đỏ'} onChange={handleInputChange} className="w-full mt-1 p-2 border border-blue-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium bg-white">
                    <option value="Sổ đỏ">Sổ đỏ</option>
                    <option value="Hợp đồng mua bán">Hợp đồng mua bán</option>
                  </select>
                </div>
              )}
              
              <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 flex-1">
                <label className="block text-[11px] font-bold mb-1 text-red-800 uppercase">Gắn nhãn HOT</label>
                <select name="nhanDan" value={formData.nhanDan || 'Không có'} onChange={handleInputChange} className="w-full mt-1 p-2 border border-red-200 rounded-lg focus:border-red-500 outline-none text-sm font-medium text-red-700 bg-white">
                  {nhanDanOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1.5 text-gray-500 uppercase">Ghi chú mật (Chỉ lưu nội bộ)</label>
              <textarea name="moTa" value={formData.moTa || ''} onChange={handleInputChange} rows="2" placeholder="VD: Pass cửa, thông tin chủ nhà, % hoa hồng..." className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm font-medium"></textarea>
            </div>

            <div className="border-2 border-dashed border-gray-300 p-5 text-center rounded-xl bg-gray-50 hover:bg-gray-100 transition">
              <label className="block font-bold mb-2 cursor-pointer text-blue-900 text-sm">Tải lên Ảnh căn hộ</label>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
              
              {images.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-xs text-blue-600 font-bold mb-2">Đã chọn {images.length} ảnh. Click ⭐ để chọn làm Ảnh Bìa.</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                    {images.map((img, i) => (
                      <div key={i} className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 snap-center transition ${i === 0 ? 'border-yellow-400 shadow-md' : 'border-gray-200 opacity-80'}`}>
                        <img src={img.url} className="w-full h-full object-cover" alt="Preview" />
                        {i === 0 ? (
                          <div className="absolute top-0 left-0 bg-yellow-400 text-[10px] text-yellow-900 px-1 font-bold rounded-br">Bìa</div>
                        ) : (
                          <button type="button" onClick={() => setCoverImage(i)} className="absolute top-1 left-1 bg-black/50 hover:bg-yellow-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center transition" title="Đặt làm ảnh bìa">⭐</button>
                        )}
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white w-5 h-5 rounded-full text-xs font-bold transition">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold text-base transition shadow-lg shadow-blue-600/30 disabled:bg-gray-400 mt-2">
               {isUploading ? 'Đang tải dữ liệu...' : (editingId ? 'CẬP NHẬT THÔNG TIN' : `ĐĂNG CĂN ${formData.listingType.toUpperCase()}`)}
            </button>
          </form>
        </div>

        <div className="flex-1 w-full bg-white p-6 md:p-8 rounded-2xl shadow-sm shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="flex flex-wrap gap-4 mb-6 border-b border-gray-100 pb-2">
            <button onClick={() => setAdminTab('quy-can')} className={`font-bold pb-3 border-b-2 transition ${adminTab === 'quy-can' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Quỹ căn ({properties.length})
            </button>
            <button onClick={() => setAdminTab('ky-gui')} className={`font-bold pb-3 border-b-2 transition flex items-center gap-2 ${adminTab === 'ky-gui' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Khách Ký Gửi
              {unreadKyGuiCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse">{unreadKyGuiCount}</span>}
            </button>
            <button onClick={() => setAdminTab('nho-tim')} className={`font-bold pb-3 border-b-2 transition flex items-center gap-2 ${adminTab === 'nho-tim' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Khách Nhờ Tìm
              {unreadNhoTimCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse">{unreadNhoTimCount}</span>}
            </button>
          </div>

          {adminTab !== 'tai-khoan' && (
             <div className="mb-6">
               <input 
                 type="text" 
                 placeholder={adminTab === 'quy-can' ? "Tìm mã căn, tòa nhà..." : "Tìm SĐT, nhu cầu khách..."}
                 value={searchTerm}
                 onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                 className="w-full max-w-sm px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
               />
             </div>
          )}

          <div className="overflow-x-auto">
            {adminTab === 'quy-can' && (
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
                          <span className="text-[10px] text-gray-500 font-semibold">{dateStr}</span>
                          {item.nhanDan && item.nhanDan !== 'Không có' && <span className="block text-[9px] text-red-600 font-bold uppercase mt-1">{item.nhanDan}</span>}
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
                            {/* CẬP NHẬT GỌI HÀM XÓA CÓ THAM SỐ LÀ CẢ OBJECT CĂN HỘ */}
                            <button onClick={() => handleDelete(item)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md font-bold transition">Xóa</button>
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
            )}

            {adminTab === 'ky-gui' && (
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
                  {kyGuiList.length === 0 && <tr><td colSpan="5" className="px-4 py-10 text-center text-gray-400 font-medium">Chưa có ai ký gửi.</td></tr>}
                </tbody>
              </table>
            )}

            {adminTab === 'nho-tim' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Khách Hàng / Nguồn</th>
                    <th className="px-4 py-3">Nhu cầu Tìm</th>
                    <th className="px-4 py-3">Yêu cầu khác</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {nhoTimList.filter(item => item.soDienThoai?.includes(searchTerm) || item.nhuCau?.toLowerCase().includes(searchTerm.toLowerCase())).map(item => {
                    let d = new Date();
                    if (item.createdAt?.seconds) d = new Date(item.createdAt.seconds * 1000);
                    const dateStr = `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                    return (
                      <tr key={item.id} className={`hover:bg-blue-50/30 transition group ${item.status === 'Chưa xử lý' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-4">
                          <span className="font-bold text-gray-900 block">{item.ten || 'Khách Vãng Lai'} - <span className="text-blue-600">{item.soDienThoai}</span></span>
                          <span className="text-[10px] text-gray-500 font-medium mt-1 block">Nguồn: {item.source} • Gửi lúc: {dateStr}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.nhuCau === 'Cho thuê' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            Tìm {item.nhuCau === 'Cho thuê' ? 'Thuê' : 'Mua'}
                          </span>
                          <span className="block text-xs font-black text-gray-800 mt-1">{item.loaiCan || 'N/A'} • {item.taiChinh || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-4 max-w-[200px]">
                          <p className="text-[11px] text-gray-600 line-clamp-2" title={item.ghiChu}>{item.ghiChu || <span className="italic text-gray-400">Không có</span>}</p>
                        </td>
                        <td className="px-4 py-4"><button onClick={() => toggleNhoTimStatus(item.id, item.status)} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${item.status === 'Chưa xử lý' ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'}`}>{item.status} (Click đổi)</button></td>
                        <td className="px-4 py-4 text-right">
                          <button onClick={() => handleDeleteNhoTim(item.id)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md font-bold transition opacity-0 group-hover:opacity-100">Xóa</button>
                        </td>
                      </tr>
                    );
                  })}
                  {nhoTimList.length === 0 && <tr><td colSpan="5" className="px-4 py-10 text-center text-gray-400 font-medium">Chưa có dữ liệu.</td></tr>}
                </tbody>
              </table>
            )}

          </div>
        </div>
      </div>
      
      {/* MODAL CẤU HÌNH PHÂN KHU TỪ ADMIN */}
      {isPhanKhuModalOpen && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-3xl transform transition-all overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="text-xl font-bold text-blue-900">Cấu Hình Phân Khu - Landing Page</h2></div>
              <button onClick={() => setIsPhanKhuModalOpen(false)} className="text-gray-400 hover:text-red-500">X</button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Chọn phân khu cần cấu hình:</label>
              <select value={selectedPK} onChange={handleSelectPKChange} className="w-full p-3 border border-blue-200 rounded-lg text-sm font-bold text-blue-900 focus:border-blue-600 outline-none bg-blue-50/50">
                {phanKhuList.map(pk => <option key={pk} value={pk}>{pk}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Mức Phí Dịch Vụ</label>
                  <input type="text" value={tempPKData.phi || ''} onChange={(e) => setTempPKData({...tempPKData, phi: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="VD: 8.800 VNĐ/m2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Thông tin Tổng quan</label>
                  <textarea rows="3" value={tempPKData.tongQuan || ''} onChange={(e) => setTempPKData({...tempPKData, tongQuan: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="Giới thiệu điểm nhấn của phân khu này..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Ưu Điểm (Mỗi dòng cách nhau ; )</label>
                  <textarea rows="3" value={tempPKData.uuDiem || ''} onChange={(e) => setTempPKData({...tempPKData, uuDiem: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="Gần nhà xe nổi; Có bể bơi bốn mùa; Nhiều trường mầm non..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hệ Thống Tiện Ích (Mỗi dòng cách nhau ; )</label>
                  <textarea rows="3" value={tempPKData.tienIch || ''} onChange={(e) => setTempPKData({...tempPKData, tienIch: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="Bể bơi nhiệt đới ngoài trời 1000m2; Sân tập gym bãi biển..."></textarea>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <label className="block text-sm font-bold text-blue-900 mb-2">Hình ảnh Cảnh quan / Tiện ích</label>
                <p className="text-xs text-gray-500 mb-4">Ảnh sẽ hiện trên slider trang phân khu (Không chèn Logo).</p>
                
                <input type="file" multiple accept="image/*" onChange={handlePKImageChange} className="w-full mb-4 text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
                
                <div className="flex flex-wrap gap-2">
                  {(tempPKData.images || []).map((url, i) => (
                    <div key={`db-${i}`} className="relative w-16 h-16 rounded-md overflow-hidden border">
                      <img src={url} className="w-full h-full object-cover opacity-80" />
                      <button onClick={() => removePKImage(i, false)} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 text-[10px] font-bold">×</button>
                    </div>
                  ))}
                  {(tempPKData.localImages || []).map((img, i) => (
                    <div key={`local-${i}`} className="relative w-16 h-16 rounded-md overflow-hidden border border-blue-400">
                      <img src={img.url} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 bg-blue-500 text-white text-[8px] w-full text-center">Mới</span>
                      <button onClick={() => removePKImage(i, true)} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 text-[10px] font-bold">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <button onClick={() => setIsPhanKhuModalOpen(false)} className="px-6 py-2.5 rounded-lg text-gray-600 font-bold hover:bg-gray-100">Hủy</button>
              <button onClick={handleSavePK} disabled={isSavingPK} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md disabled:opacity-50">Lưu Landing Page</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP BÁO TRÙNG LẶP DỮ LIỆU ĐÃ FIX HIỆU ỨNG DISABLED */}
      {duplicateWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md text-center animate-fade-in-up">
             <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
             </div>
             <h3 className="text-xl font-bold text-red-600 mb-2">Phát hiện dữ liệu trùng lặp!</h3>
             <p className="text-sm text-gray-600 mb-4">Hệ thống nhận thấy bạn đang nhập một căn hộ có thông số giống hệt với căn đang có trên hệ thống.</p>
             
             <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <span className="text-xs text-gray-500">Mã căn bị trùng:</span>
                <p className="text-lg font-black text-blue-900">{duplicateWarning.maCan}</p>
                <a href={`/property/${duplicateWarning.id}`} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-bold hover:underline mt-2 inline-block">
                  Mở xem chi tiết căn này ↗
                </a>
             </div>

             <div className="flex gap-3">
               <button onClick={() => setDuplicateWarning(null)} disabled={isUploading} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50">Hủy bỏ</button>
               {/* Khóa nút ngay khi bấm và hiện "Đang lưu..." để chống click liên tục */}
               <button onClick={() => { setSkipDupCheck(true); executeSave(); }} disabled={isUploading} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                 {isUploading ? 'Đang lưu...' : 'Vẫn lưu bài mới'}
               </button>
             </div>
          </div>
        </div>
      )}

      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl transform transition-all overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="text-xl font-bold text-blue-900">Quản Lý Tài Khoản</h2></div>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-gray-400 hover:text-red-500">X</button>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">Chỉ những tài khoản Gmail dưới đây mới có quyền Đăng nhập và Quản trị nội dung Website này.</p>
            
            <div className="flex gap-3 mb-6">
              <input type="email" placeholder="Nhập Gmail của cộng tác viên..." value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 text-sm" />
              <button onClick={handleAddEmail} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md transition whitespace-nowrap">Thêm quyền</button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
               <ul className="divide-y divide-gray-100">
                 {allowedEmails.map(email => (
                    <li key={email} className="flex justify-between items-center p-4 hover:bg-gray-50 transition">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{email[0].toUpperCase()}</div>
                         <div>
                            <p className="text-sm font-bold text-gray-800">{email}</p>
                            {email === user?.email && <p className="text-[10px] text-green-600 font-bold">Đang đăng nhập (Bạn)</p>}
                         </div>
                       </div>
                       {email !== user?.email && (
                         <button onClick={() => handleRemoveEmail(email)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md text-xs font-bold transition border border-transparent hover:border-red-200">Thu hồi quyền</button>
                       )}
                    </li>
                 ))}
               </ul>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setIsAccountModalOpen(false)} className="px-6 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200">Đóng</button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}