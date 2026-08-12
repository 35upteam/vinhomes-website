'use client';
import { useEffect, useState } from 'react';
import { db } from '../firebase-config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-center mt-20 text-xl font-bold">Đang tải quỹ căn Vinhomes Smart City...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-900">Vinhomes Lifestyle</h1>
        <a href="#contact" className="text-sm font-medium hover:text-blue-600">Liên hệ</a>
      </header>

      <section className="px-6 py-12 bg-white">
        <p className="text-gray-500 mb-2 uppercase tracking-wider text-sm font-semibold">Vinhomes Smart City</p>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Căn hộ chuyển nhượng <br /> & cho thuê</h1>
        <p className="text-lg text-gray-600 max-w-2xl">Bảng hàng cập nhật theo giờ — chọn căn đúng nhu cầu tại Vinhomes Smart City.</p>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Danh sách quỹ căn</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.length === 0 && <p>Hiện chưa có căn hộ nào. Hãy đăng căn đầu tiên!</p>}
          {properties.map(item => (
            <article key={item.id} className="bg-white rounded-xl shadow border overflow-hidden">
               <div className="h-48 overflow-hidden bg-gray-200">
                  {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt="Căn hộ" className="w-full h-full object-cover" />
                  ) : <span className="p-4 flex items-center justify-center h-full text-gray-500">Chưa có ảnh</span>}
               </div>
               <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">Mã căn: {item.maCan} • Tòa {item.building} ({item.floor})</p>
                  <h3 className="font-bold text-lg mb-2">Thuê {item.type} {item.area}m² tòa {item.building}</h3>
                  <p className="font-bold text-xl text-blue-700">{item.price} triệu/tháng</p>
                  <a href={`https://zalo.me/0373788017?text=${encodeURIComponent(`Xin chào, tôi quan tâm căn ${item.type} ${item.area}m2 tòa ${item.building} giá ${item.price} triệu/tháng.`)}`} target="_blank" rel="noreferrer" className="mt-4 block w-full bg-blue-600 text-white text-center py-2.5 rounded-lg font-medium">
                      Chat Zalo Ngay
                  </a>
               </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}