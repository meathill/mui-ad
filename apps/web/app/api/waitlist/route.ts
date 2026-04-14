import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const db = env.DB;

    // 检查邮箱是否已存在
    const existing = await db.prepare('SELECT id FROM waitlist WHERE email = ?').bind(email).first();

    if (existing) {
      return NextResponse.json({ error: 'Email already on waitlist' }, { status: 409 });
    }

    // 添加到 waitlist
    const createdAt = new Date().toISOString();
    await db.prepare('INSERT INTO waitlist (email, created_at) VALUES (?, ?)').bind(email, createdAt).run();

    console.log('Added to waitlist:', email);

    return NextResponse.json({ message: 'Successfully added to waitlist!' }, { status: 200 });
  } catch (error: any) {
    console.error('Waitlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
