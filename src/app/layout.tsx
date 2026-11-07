import type { Metadata, Viewport } from 'next';
import { Press_Start_2P, VT323, Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import './battle-layout.css';
import './navbar.css';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
});

const vt323Font = VT323({
  weight: '400',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-vt323',
  display: 'swap',
});

const vietnamFont = Be_Vietnam_Pro({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-vietnam',
  display: 'swap',
});

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export const metadata: Metadata = {
  title: 'DICE MANIAC - 1v1 Turn-Based RPG Dice Combat',
  description: 'Epic 1v1 turn-based RPG with 3D D20 and D6 dice physics, custom characters, 6 classes, and 9 legendary weapons.',
  icons: {
    icon: '/assets/images/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${pixelFont.variable} ${vt323Font.variable} ${vietnamFont.variable} dark select-none scroll-smooth`}
    >
      <body className="antialiased bg-[#07090e] text-slate-100 min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
