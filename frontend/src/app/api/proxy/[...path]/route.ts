import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const LARAVEL_API = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';

// Handle GET, POST, PUT, PATCH, DELETE untuk semua path di bawah /api/proxy/*
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const { path } = await params;
    const targetPath = path.join('/');

    // Teruskan query params
    const url = new URL(req.url);
    const laravelUrl = `${LARAVEL_API}/${targetPath}${url.search}`;

    // Siapkan headers untuk dikirim ke Laravel
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Siapkan body (hanya untuk method yang memiliki body)
    let body: string | undefined;
    if (!['GET', 'HEAD'].includes(req.method)) {
      const text = await req.text();
      if (text) body = text;
    }

    const laravelRes = await fetch(laravelUrl, {
      method: req.method,
      headers,
      body,
    });

    // Jika 401 dari Laravel, hapus cookie yang sudah tidak valid
    if (laravelRes.status === 401) {
      cookieStore.delete('auth_token');
    }

    const contentType = laravelRes.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await laravelRes.json();
      return NextResponse.json(data, { status: laravelRes.status });
    }

    // Response non-JSON (misal file download)
    const rawBody = await laravelRes.arrayBuffer();
    return new NextResponse(rawBody, {
      status: laravelRes.status,
      headers: { 'Content-Type': contentType },
    });
  } catch {
    return NextResponse.json({ message: 'Proxy error' }, { status: 502 });
  }
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;
