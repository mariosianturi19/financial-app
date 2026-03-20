import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ALL_DEFAULT_CATEGORIES } from '@/lib/defaultCategories';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Semua field wajib diisi.' }, { status: 422 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password minimal 8 karakter.' }, { status: 422 });
    }

    // Buat user via Admin Client — email langsung terkonfirmasi (tanpa perlu verifikasi email)
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true, // ← auto-confirm, tidak perlu klik link di email
    });

    if (adminError) {
      // Email sudah terdaftar
      if (adminError.message.includes('already been registered') || adminError.code === 'email_exists') {
        return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 422 });
      }
      return NextResponse.json({ message: adminError.message }, { status: 400 });
    }

    const userId = adminData.user?.id;
    if (!userId) {
      return NextResponse.json({ message: 'Gagal membuat akun.' }, { status: 500 });
    }

    // Seed kategori default
    const now = new Date().toISOString();
    await supabaseAdmin.from('categories').insert(
      ALL_DEFAULT_CATEGORIES.map((cat) => ({
        user_id:    userId,
        name:       cat.name,
        type:       cat.type,
        icon:       cat.icon,
        color:      cat.color,
        is_default: true,
        created_at: now,
        updated_at: now,
      }))
    );

    // Login otomatis setelah register — set session cookies
    const supabase = await createClient();
    await supabase.auth.signInWithPassword({ email, password });

    const user = {
      id:    userId,
      name:  adminData.user?.user_metadata?.name ?? name,
      email: adminData.user?.email ?? email,
    };

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
