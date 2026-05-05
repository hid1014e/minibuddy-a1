import type { Metadata } from 'next';
import './globals.css';
import MirrorButton from './components/MirrorButton';

export const metadata: Metadata = {
  title: 'やわらかの旅',
  description: '5分から始める7日間チャレンジ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ background: '#f7f3ed', minHeight: '100vh' }}>
        <a
          href="https://forms.gle/vnipBGp67zjsTj9W7"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '16px',
            zIndex: 9999,
            background: '#ffffff',
            border: '1px solid #d4cabb',
            borderRadius: '20px',
            padding: '6px 12px',
            color: '#4a7c59',
            fontSize: '12px',
            fontFamily: 'Nunito, sans-serif',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            opacity: 0.9,
          }}
        >
          <span>ご意見</span>
        </a>
        <MirrorButton />
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px', background: 'transparent' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
