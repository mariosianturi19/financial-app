const fs = require('fs');
const file = 'd:/Kuliah/Bahan Kuliah/Matkul/Vscode/financial-app/frontend/src/app/(auth)/login/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

const sIdx = txt.indexOf('return (');
const eIdx = txt.indexOf('{/* Heading */}');

const newStr = \eturn (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Orbs */}
      <div style={{
        position: 'fixed', top: '-15%', left: '-5%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,111,247,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-5%',
        width: 380, height: 380, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }} className="animate-fadeup">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--grad-violet)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, marginBottom: 16,
            boxShadow: '0 8px 32px rgba(124,111,247,0.35)',
          }}>💎</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
            FinApp
          </p>
        </div>

        \;

txt = txt.substring(0, sIdx) + newStr + txt.substring(eIdx);

const tagIdx = txt.lastIndexOf('</div>', txt.indexOf('<style>'));
if (tagIdx !== -1) {
  txt = txt.substring(0, tagIdx) + txt.substring(tagIdx + 6);
}

fs.writeFileSync(file, txt);
console.log('done!');
