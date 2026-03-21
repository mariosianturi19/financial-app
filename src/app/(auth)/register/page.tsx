'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The register page is now combined with login via flip card animation.
// Redirect users who visit /register directly to /login (flip will handle the rest).
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, [router]);
  return null;
}