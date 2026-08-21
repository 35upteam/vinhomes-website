import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// KHÔI PHỤC LẠI FONT INTER GỐC CỦA BẠN (CÓ HỖ TRỢ TIẾNG VIỆT)
const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata = {
  title: 'Quỹ Căn Smart City - Bán & Cho Thuê Giá Tốt Nhất',
  description: 'Chuyên trang tổng hợp nguồn hàng mua bán, chuyển nhượng, cho thuê căn hộ tại Vinhomes Smart City Tây Mỗ. Cập nhật quỹ căn mới mỗi ngày tại mọi phân khu.',
  icons: {
    icon: '/icon.png?v=9999',
    apple: '/icon.png?v=9999',
  },
  openGraph: {
    title: 'Quỹ Căn Smart City - Bán & Cho Thuê Giá Tốt Nhất',
    description: 'Bảng hàng cập nhật liên tục 24/7. Nhận tư vấn, ký gửi và tìm nhà theo yêu cầu tại Vinhomes Smart City.',
    url: 'https://quycan-smartcity.com', 
    siteName: 'Quỹ Căn Smart City',
    images: [{ url: '/banner.jpg', width: 1200, height: 630, alt: 'Vinhomes Smart City' }],
    locale: 'vi_VN',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        {/* ĐOẠN MÃ NHÚNG GOOGLE ANALYTICS 4 (GA4) */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-ZX1QY359HK" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZX1QY359HK');
          `}
        </Script>
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}