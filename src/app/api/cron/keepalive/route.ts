import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0; // Disable cache untuk route ini

export async function GET(request: Request) {
  // Opsional: Proteksi route agar hanya bisa dipanggil oleh Vercel Cron atau script pribadimu.
  // Jika kamu deploy di Vercel, set Environment Variable `CRON_SECRET` di dashboard Vercel.
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Menggunakan supabase standar (tanpa SSR/Cookies karena ini dipanggil oleh robot bot background)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Lakukan query super ringan (hanya menarik 1 ID kategori)
    // Tujuannya murni hanya memberi tahu Supabase: "Database ini masih aktif digunakan kok!"
    const { error } = await supabase.from('categories').select('id').limit(1);

    if (error) throw error;

    return NextResponse.json({
      message: 'Supabase keep-alive ping successful!',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Supabase keep-alive failed.', error },
      { status: 500 }
    );
  }
}
