import type { Metadata } from 'next';
import './globals.css';
import MirrorButton from './components/MirrorButton';

export const metadata: Metadata = {
  title: 'Hagrit',
  description: '7日チャレンジ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ background: '#1a0a2e', minHeight: '100vh' }}>
        <a
          href="https://forms.gle/vnipBGp67zjsTj9W7"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '16px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #2d1b4e, #1a0a2e)',
            border: '1px solid rgba(124, 92, 191, 0.33)',
            borderRadius: '20px',
            padding: '6px 12px',
            color: '#c9a84c',
            fontSize: '12px',
            fontFamily: 'Nunito, sans-serif',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 0 8px rgba(124, 92, 191, 0.2)',
            opacity: 0.85,
          }}
        >
          <span>ご意見</span>
        </a>
        <MirrorButton />
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
