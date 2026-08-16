import './globals.css'

export const metadata = {
  title: 'Quỹ Căn Smart City - Bán & Cho Thuê Giá Tốt Nhất',
  description: 'Chuyên trang tổng hợp nguồn hàng mua bán, chuyển nhượng, cho thuê căn hộ tại Vinhomes Smart City Tây Mỗ. Cập nhật quỹ căn mới mỗi ngày tại mọi phân khu.',
  openGraph: {
    title: 'Quỹ Căn Smart City - Bán & Cho Thuê Giá Tốt Nhất',
    description: 'Bảng hàng cập nhật liên tục 24/7. Nhận tư vấn, ký gửi và tìm nhà theo yêu cầu tại Vinhomes Smart City.',
    url: 'https://quycan-smartcity.com', 
    siteName: 'Quỹ Căn Smart City',
    images: [
      {
        url: '/banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Toàn cảnh Vinhomes Smart City',
      }
    ],
    locale: 'vi_VN',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased text-gray-800 bg-gray-50">{children}</body>
    </html>
  )
}