'use client';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import Link from 'next/link';

// Component Thẻ Căn Hộ
const PropertyCard = ({ item, contactPhone }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const images = item.images && item.images.length > 0 ? item.images : [];
  
  const nextImg = (e) => { e.preventDefault(); if (currentImg < images.length - 1) setCurrentImg(currentImg + 1); };
  const prevImg = (e) => { e.preventDefault(); if (currentImg > 0) setCurrentImg(currentImg - 1); };

  return (
    <Link href={`/property/${item.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col">
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        {images.length > 0 ? (
          <img src={images[currentImg]} alt="Căn hộ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Chưa có ảnh</div>
        )}
        
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10">‹</button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10">›</button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
              {images.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all ${currentImg === idx ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`}></div>
              ))}
            </div>
          </>
        )}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-bold text-blue-900 uppercase shadow-sm z-10">
          {item.loaiCan || item.type}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">MÃ CĂN: {item.maCan || 'ĐANG CẬP NHẬT'}</p>
        
        <div className="mb-4 pb-3 border-b border-gray-100">
           <h3 className="font-bold text-blue-900 text-lg uppercase tracking-tight group-hover:text-blue-600 transition-colors">
             {item.phanKhu} - Tòa {item.toaNha || item.building}
           </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-[11px] text-gray-600 mb-5">
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🏢</span> {item.khoangTang || 'Đang cập nhật'}</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">📐</span> {item.area} m²</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🧭</span> {item.huongBanCong || 'Đang cập nhật'}</div>
          <div className="flex items-center gap-1.5"><span className="text-gray-400">🛋️</span> {item.noiThat || 'Đang cập nhật'}</div>
        </div>

        <div className="mt-auto">
          <div className="text-xl font-bold text-blue-700 mb-4">
            {item.price} <span className="text-xs font-medium text-gray-500">{item.listingType === 'Chuyển nhượng' ? 'Tỷ' : 'triệu/tháng'}</span>
          </div>
          <div className="flex gap-2">
            <object className="flex-1"><a href={`tel:${contactPhone}`} className="block w-full bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 text-center py-2.5 rounded-md text-sm font-semibold transition flex justify-center items-center gap-1.5">Liên hệ</a></object>
            <object className="flex-1"><a href={`https://zalo.me/${contactPhone}`} target="_blank" rel="noreferrer" className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded-md text-sm font-semibold transition flex justify-center items-center gap-1.5 shadow-sm">Zalo</a></object>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('Cho thuê');
  const [sortBy, setSortBy] = useState('newest');
  
  // Trạng thái Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [filters, setFilters] = useState({
    phanKhu: 'Tất cả phân khu',
    loaiCan: 'Tất cả loại căn',
    khoangTang: 'Tất cả tầng',
    huongBanCong: 'Tất cả hướng',
    noiThat: 'Tất cả nội thất'
  });

  const CONTACT_PHONE = "0912791925";
  const LOGO_URL = "https://res.cloudinary.com/ibzfmsqp/image/upload/v1714576332/logo-quy-can_p1d8r4.png"; // Link giả định chứa Logo xịn của bạn, hệ thống sẽ render ảnh từ link này

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProperties(data);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      }
      setLoading(false);
    };
    fetchProperties();
  }, []);

  const handleFilterChange = (e) => { 
    setFilters({ ...filters, [e.target.name]: e.target.value }); 
    setCurrentPage(1); // Reset về trang 1 khi đổi bộ lọc
  };
  const handleLoaiCanClick = (type) => { 
    setFilters({ ...filters, loaiCan: filters.loaiCan === type ? 'Tất cả loại căn' : type }); 
    setCurrentPage(1);
  };

  const filteredProperties = properties.filter(item => {
    const matchTab = item.listingType === activeTab || (!item.listingType && activeTab === 'Cho thuê');
    const matchPhanKhu = filters.phanKhu === 'Tất cả phân khu' || item.phanKhu === filters.phanKhu;
    const matchLoaiCan = filters.loaiCan === 'Tất cả loại căn' || item.loaiCan === filters.loaiCan || item.type === filters.loaiCan;
    const matchKhoangTang = filters.khoangTang === 'Tất cả tầng' || item.khoangTang === filters.khoangTang;
    const matchHuong = filters.huongBanCong === 'Tất cả hướng' || item.huongBanCong === filters.huongBanCong;
    const matchNoiThat = filters.noiThat === 'Tất cả nội thất' || item.noiThat === filters.noiThat;
    return matchTab && matchPhanKhu && matchLoaiCan && matchKhoangTang && matchHuong && matchNoiThat;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'priceAsc') {
      return a.price - b.price;
    } else {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    }
  });

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
  const currentProperties = sortedProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      
      {/* HEADER: Gắn Logo xịn và Nút Liên hệ tinh tế */}
      <header className="bg-white sticky top-0 z-50 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="h-10 md:h-12 w-auto flex items-center">
             <img src="https://i.ibb.co/tCg9sT4/logo-quy-can-smart-city.png" alt="Quỹ Căn Smart City Logo" className="h-full object-contain" />
          </div>
        </Link>
        <div className="flex items-center gap-4">
           <a href={`https://zalo.me/${CONTACT_PHONE}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-1.5 rounded-full font-medium transition text-sm">
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21.406 9.353c-.114-5.06-4.523-8.88-9.83-8.88C6.073.473 1.5 4.542 1.5 9.873c0 2.68 1.157 5.178 3.167 6.945-.333 1.09-1.077 2.37-1.196 2.585-.148.267.085.57.382.493 1.838-.475 3.33-1.393 4.22-2.025 1.12.316 2.296.485 3.504.485 5.503 0 10.073-4.068 10.073-9.4 0-.154-.01-.307-.024-.46v-.142h-.22zM15.42 11.23h-2.12v1.39h2.12v.94H12.24v-4.14h3.18v.93h-2.12v.88zM9.54 12.35l-2.01-2.92h1.99v-.94H6.38v.94l2.02 2.92H6.38v.93h3.16v-.93zM18.89 12.18c0 1.2-.84 1.82-1.92 1.82s-1.92-.62-1.92-1.82v-1.63c0-1.2.84-1.82 1.92-1.82s1.92.62 1.92 1.82v1.63zm-2.88 0c0 .64.39 1 1 1s1-.36 1-1v-1.63c0-.64-.39-1-1-1s-1 .36-1 1v1.63zM21.57 6.13c-.02-.13-.04-.26-.06-.39-.02-.12-.04-.25-.07-.37-.03-.13-.06-.25-.09-.37-.04-.12-.08-.24-.12-.36-.05-.13-.1-.25-.15-.37-.05-.12-.11-.23-.17-.35-.06-.12-.12-.24-.19-.36-.07-.12-.14-.23-.21-.34-.08-.12-.16-.23-.24-.34-.09-.11-.18-.22-.27-.33-.1-.11-.2-.21-.3-.32-.1-.1-.21-.21-.32-.3-.11-.1-.22-.2-.33-.29-.11-.09-.23-.18-.35-.26-.12-.08-.24-.16-.36-.23-.13-.07-.26-.14-.4-.2-.13-.06-.26-.11-.39-.16-.14-.05-.28-.1-.42-.14-.14-.04-.28-.08-.42-.11-.15-.03-.3-.06-.45-.08-.15-.02-.3-.04-.45-.05h-.9c-.15.01-.3.03-.45.05-.15.02-.3.05-.45.08-.14.03-.28.07-.42.11-.14.04-.28.09-.42.14-.13.05-.26.1-.39.16-.14.06-.27.13-.4.2-.12.07-.24.15-.36.23-.12.08-.24.17-.35.26-.11.09-.22.19-.33.29-.1.1-.21.2-.32.3-.11.11-.21.22-.3.32-.09.11-.18.22-.27.33-.08.11-.15.22-.24.34-.07.11-.14.22-.21.34-.07.12-.13.24-.19.36-.06.12-.12.23-.17.35-.05.12-.1.24-.15.37-.04.12-.08.24-.12.36-.03.12-.06.24-.09.37-.03.12-.05.25-.07.37-.02.13-.04.26-.06.39-.01.13-.02.26-.03.39v.78c.01.13.02.26.03.39.02.13.04.26.06.39.02.12.04.25.07.37.03.13.06.25.09.37.04.12.08.24.12.36.05.13.1.25.15.37.05.12.11.23.17.35.06.12.12.24.19.36.07.12.14.23.21.34.08.12.16.23.24.34.09.11.18.22.27.33.1.11.2.21.3.32.1.1.21.21.32.3.11.1.22.2.33.29.11.09.23.18.35.26.12.08.24.16.36.23.13.07.26.14.4.2.13.06.26.11.39.16.14.05.28.1.42.14.14.04.28.08.42.11.15.03.3.06.45.08.15.02.3.04.45.05h.9c.15-.01.3-.03.45-.05.15-.02.3-.05.45-.08.14-.03.28-.07.42-.11.14-.04.28-.09.42-.14.13-.05.26-.1.39-.16.14-.06.27-.13.4-.2.12-.07.24-.15.36-.23.12-.08.24-.17.35-.26.11-.09.22-.19.33-.29.1-.1.21-.2.32-.3.11-.11.21-.22.3-.32.09-.11.18-.22.27-.33.08-.11.15-.22.24-.34.07-.11.14-.22.21-.34.07-.12.13-.24.19-.36.06-.12.12-.23.17-.35.05-.12.1-.24.15-.37.04-.12.08-.24.12-.36.03-.12.06-.24.09-.37.03-.12.05-.25.07-.37.02-.13.04-.26.06-.39z"/></svg>
             Chat Zalo ngay
           </a>
        </div>
      </header>

      <section className="relative bg-blue-900 text-white py-20 px-4 md:px-12 flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-900/90 to-transparent"></div>
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <p className="text-xs font-semibold text-blue-200 mb-3 uppercase tracking-[0.2em]">Vinhomes Smart City</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-5 leading-[1.15] tracking-tight">Quỹ căn chuyển nhượng<br/>& cho thuê</h2>
          <p className="text-sm md:text-base text-gray-300 max-w-lg font-light leading-relaxed">Bảng hàng cập nhật theo giờ — chọn căn đúng nhu cầu tại Vinhomes Smart City.</p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-6 w-full">
        <div className="flex gap-2 border-b border-gray-200">
           <button onClick={() => {setActiveTab('Cho thuê'); setFilters({...filters, loaiCan: 'Tất cả loại căn'}); setCurrentPage(1);}} className={`py-3 px-6 text-sm font-bold transition relative ${activeTab === 'Cho thuê' ? 'text-blue-900' : 'text-gray-500 hover:text-gray-800'}`}>
             Cho thuê
             {activeTab === 'Cho thuê' && <div className="absolute bottom-[-1px] left-0 w-full h-1 bg-blue-600 rounded-t"></div>}
           </button>
           <button onClick={() => {setActiveTab('Chuyển nhượng'); setFilters({...filters, loaiCan: 'Tất cả loại căn'}); setCurrentPage(1);}} className={`py-3 px-6 text-sm font-bold transition relative ${activeTab === 'Chuyển nhượng' ? 'text-blue-900' : 'text-gray-500 hover:text-gray-800'}`}>
             Chuyển nhượng (Bán)
             {activeTab === 'Chuyển nhượng' && <div className="absolute bottom-[-1px] left-0 w-full h-1 bg-blue-600 rounded-t"></div>}
           </button>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start flex-grow w-full">
        <aside className="w-full lg:w-[280px] flex-shrink-0 bg-white p-5 rounded-xl shadow-sm border border-gray-200 sticky top-24 self-start">
          <h3 className="font-bold text-lg mb-6 text-blue-900">Bộ lọc chi tiết</h3>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Phân khu</label>
              <select name="phanKhu" value={filters.phanKhu} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-blue-600 outline-none">
                <option>Tất cả phân khu</option>
                {['Sapphire', 'Miami', 'Sakura', 'Victoria', 'Imperia', 'Sola Park', 'Tonkin', 'Canopy', 'Masteri West Height', 'Lumiere Evergreen'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Loại căn</label>
              <div className="grid grid-cols-2 gap-2">
                 {['Studio', '1N', '1N+', '2N1WC', '2N2WC', '2N+', '3N', '4N'].map(type => (
                   <button key={type} onClick={() => handleLoaiCanClick(type)} className={`border py-1.5 rounded-md text-[11px] font-medium transition ${filters.loaiCan === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:border-blue-400'}`}>
                     {type}
                   </button>
                 ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Khoảng tầng</label>
              <select name="khoangTang" value={filters.khoangTang} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-blue-600 outline-none">
                <option>Tất cả tầng</option>
                {['Tầng thấp', 'Tầng trung', 'Tầng cao'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Hướng ban công</label>
              <select name="huongBanCong" value={filters.huongBanCong} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-blue-600 outline-none">
                <option>Tất cả hướng</option>
                {['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Hiện trạng nội thất</label>
              <select name="noiThat" value={filters.noiThat} onChange={handleFilterChange} className="w-full p-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:border-blue-600 outline-none">
                <option>Tất cả nội thất</option>
                {['Nguyên bản CĐT', 'Đồ cơ bản', 'Đầy đủ nội thất'].map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </aside>

        <section className="flex-1 w-full flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4 sm:border-0 sm:pb-0 border-gray-200">
             <div>
               <h3 className="text-xl font-bold text-blue-900 inline-block mr-2">{activeTab}</h3>
               <span className="text-[13px] font-normal text-gray-500 inline-block mt-1 sm:mt-0">Tìm thấy {sortedProperties.length} căn hộ phù hợp</span>
             </div>
             
             <div className="flex items-center gap-2 w-full sm:w-auto bg-gray-100 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:block">Sắp xếp:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto text-sm border-gray-200 rounded-md border py-2 px-3 text-gray-700 focus:outline-none focus:border-blue-600 bg-white cursor-pointer shadow-sm">
                  <option value="newest">⏳ Cập nhật mới nhất</option>
                  <option value="priceAsc">📈 Giá từ thấp đến cao</option>
                </select>
             </div>
          </div>

          {currentProperties.length === 0 ? (
             <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm flex-grow">
                <p className="text-gray-500">Chưa có quỹ căn phù hợp với bộ lọc của bạn.</p>
             </div>
          ) : (
            <>
              {/* Lưới 9 Căn hộ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                {currentProperties.map(item => (
                  <PropertyCard key={item.id} item={item} contactPhone={CONTACT_PHONE} />
                ))}
              </div>
              
              {/* Khối Gợi Ý "Nhờ Tìm Căn" */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm mb-10 w-full">
                <div>
                  <h4 className="text-xl font-bold text-blue-900 mb-2">Không cần tự lướt hết quỹ căn</h4>
                  <p className="text-sm text-gray-600">Gửi nhu cầu, chúng tôi sẽ chọn 3-5 căn sát ngân sách và thời gian vào ở nhất để gửi lại cho anh/chị.</p>
                </div>
                <a href={`https://zalo.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Xin chào, tôi muốn nhờ tìm giúp một căn hộ ${activeTab} tại Vinhomes Smart City.`)}`} target="_blank" rel="noreferrer" className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-3 rounded-md font-bold whitespace-nowrap transition shadow flex items-center gap-2 w-full md:w-auto justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  Nhờ tìm căn phù hợp
                </a>
              </div>

              {/* Bộ phân trang (Pagination) */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-auto">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition">
                    ‹
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 flex items-center justify-center rounded-md font-bold transition ${currentPage === i + 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition">
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* FOOTER: Rút gọn thành 2 cột */}
      <footer className="bg-white border-t border-gray-200 py-12 px-4 md:px-12 w-full mt-auto">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-sm text-gray-600">
           
           {/* Cột 1: Thông tin thương hiệu */}
           <div className="md:pr-10">
             <div className="flex items-center gap-3 mb-6">
               <div className="h-12 w-auto flex items-center">
                 <img src="https://i.ibb.co/tCg9sT4/logo-quy-can-smart-city.png" alt="Quỹ Căn Smart City Logo" className="h-full object-contain grayscale opacity-80" />
               </div>
             </div>
             <p className="leading-relaxed font-light mb-4">Cổng thông tin dữ liệu về căn hộ chuyển nhượng, cho thuê uy tín, chuyên nghiệp tại dự án Vinhomes Smart City.</p>
             <p className="text-xs text-gray-400">© 2026 Quỹ Căn Smart City. Không phải website của chủ đầu tư.</p>
           </div>
           
           {/* Cột 2: Liên hệ (Theo yêu cầu) */}
           <div className="md:pl-10 md:border-l border-gray-100">
             <p className="font-bold text-blue-900 mb-5 text-xs uppercase tracking-wider">Thông tin chuyên viên</p>
             <div className="space-y-4 font-light text-[15px]">
               <p className="flex items-center gap-3">
                 <span className="text-gray-400">👤</span> <strong className="text-gray-800">Nguyễn An Ninh</strong>
               </p>
               <p className="flex items-center gap-3">
                 <span className="text-gray-400">📍</span> Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội
               </p>
               <p className="flex items-center gap-3">
                 <span className="text-gray-400">📞</span> 
                 <a href={`tel:${CONTACT_PHONE}`} className="font-bold text-blue-600 hover:text-blue-800 transition">{CONTACT_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a> 
                 <span className="text-gray-400 text-xs ml-1">(SĐT / Zalo)</span>
               </p>
             </div>
             
             {/* Mạng xã hội */}
             <div className="flex items-center gap-4 mt-6">
                <a href="https://www.facebook.com/AnNinhNAN/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-black hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.34 2.88 2.88 0 0 1 2.31-4.53 2.66 2.66 0 0 1 1.61.53V9.5a6.33 6.33 0 0 0-3.92-1.34 6.33 6.33 0 1 0 6.33 6.33V8.67a8.4 8.4 0 0 0 6.09 2.36V7.61a5 5 0 0 1-1-.92z"/></svg>
                </a>
             </div>
           </div>

        </div>
      </footer>
    </div>
  );
}