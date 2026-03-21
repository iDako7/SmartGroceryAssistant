import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { AuthProvider } from '../lib/auth-context';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Smart Grocery Assistant',
  description: 'AI-powered grocery list manager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
