import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { publicIds } = await req.json();
    if (!publicIds || publicIds.length === 0) {
      return NextResponse.json({ success: true });
    }

    const CLOUD_NAME = 'ibzfmsqp'; 
    const API_KEY = '924234223248534'; 
    const API_SECRET = 'egdkm0AY0J6vGXe8h0KIsGv8e8g';

    const timestamp = Math.floor(Date.now() / 1000);

    for (const publicId of publicIds) {
      const signatureString = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
      const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

      const formData = new URLSearchParams();
      formData.append('public_id', publicId);
      formData.append('timestamp', timestamp);
      formData.append('api_key', API_KEY);
      formData.append('signature', signature);

      await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi xóa ảnh:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}