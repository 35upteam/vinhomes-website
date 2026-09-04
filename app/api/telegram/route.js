import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { text, parse_mode } = body;

    // Đưa Token vào đây, nó sẽ được bảo mật tuyệt đối trên Server
    const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || "7295171731:AAEUgA3z1y3D6o_cK8t6W42aXfN-6I";
    const CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || "6190858172";

    // 1. Gửi tin nhắn có định dạng HTML
    let res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode })
    });

    // 2. Cơ chế Fallback: Nếu lỗi định dạng HTML, tự động gửi lại bằng chữ thường
    if (!res.ok && parse_mode === 'HTML') {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: text.replace(/<[^>]*>?/gm, '') })
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}