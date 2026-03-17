'use client';

import { useEffect, useRef } from 'react';

/**
 * CursorGlow — renders a soft ambient orb that follows the mouse cursor.
 * Desktop only. No impact on performance (uses CSS custom properties + RAF).
 * Drop this once inside the app layout, above everything else.
 */
export default function CursorGlow() {
  const orbRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pos    = useRef({ x: -300, y: -300 }); // start offscreen
  const cur    = useRef({ x: -300, y: -300 }); // smooth current

  useEffect(() => {
    // Only on non-touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Smooth lerp — lag factor 0.08 gives a nice trailing feel
      cur.current.x += (pos.current.x - cur.current.x) * 0.08;
      cur.current.y += (pos.current.y - cur.current.y) * 0.08;

      if (orbRef.current) {
        orbRef.current.style.transform =
          `translate(${cur.current.x - 200}px, ${cur.current.y - 200}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,111,247,0.07) 0%, rgba(124,111,247,0.025) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
        willChange: 'transform',
        /* Starts offscreen */
        transform: 'translate(-300px, -300px)',
      }}
      ref={orbRef}
    />
  );
}