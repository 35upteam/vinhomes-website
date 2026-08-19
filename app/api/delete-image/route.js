import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { publicIds } = await req.json();
    if (!publicIds || !publicIds.length) {
      return NextResponse.json({ message: 'No public IDs provided' }, { status: 400 });
    }

    const cloudName = "ibzfmsqp"; // Tên Cloudinary của bạn
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ message: 'Cloudinary credentials missing' }, { status: 500 });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);

    // Xóa đồng loạt tất cả các ảnh của căn hộ
    const deletePromises = publicIds.map(async (publicId) => {
      const signature = crypto.createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest('hex');
      
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        body: formData
      });
      return res.json();
    });

    await Promise.all(deletePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi xóa ảnh:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}