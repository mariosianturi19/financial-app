import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const LARAVEL_API = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token) {
      // Beritahu Laravel untuk invalidate token
      await fetch(`${LARAVEL_API}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Hapus httpOnly cookie
    cookieStore.delete('auth_token');

    return NextResponse.json({ message: 'Logged out successfully.' });
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
