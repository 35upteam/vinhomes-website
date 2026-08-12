/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ép Vercel bỏ qua các lỗi cảnh báo code vặt khi xuất bản
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;