import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const LARAVEL_API = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const laravelRes = await fetch(`${LARAVEL_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await laravelRes.json();

    if (!laravelRes.ok) {
      return NextResponse.json(data, { status: laravelRes.status });
    }

    // Simpan token di httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return NextResponse.json({ user: data.user }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
