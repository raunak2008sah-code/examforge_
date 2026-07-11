import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/tokens.css';
import '../styles/ui.css';
import '../styles/admin.css'; // if needed, although maybe it's just ui.css

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ExamForge 2.0',
  description: 'ExamForge next-generation CBT platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ margin: 0, backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
        {children}
      </body>
    </html>
  );
}
