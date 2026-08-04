import { Manrope, Noto_Sans_Malayalam } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const notoMalayalam = Noto_Sans_Malayalam({
  subsets: ['malayalam'],
  variable: '--font-noto-malayalam',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata = {
  title: 'Orvyn PMS - Property Management System',
  description: 'Manage your properties, tenants, and automated payments easily with Orvyn PMS',
  icons: {
    icon: [{ url: '/icon.svg?v=2', type: 'image/svg+xml' }],
    shortcut: '/icon.svg?v=2',
    apple: '/icon.svg?v=2',
  },
};

export default function RootLayout({
  children,
}: {
  children: any;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${notoMalayalam.variable}`}>
      <head>
        <link rel="icon" href="/icon.svg?v=2" type="image/svg+xml" sizes="any" />
        <link rel="shortcut icon" href="/icon.svg?v=2" />
        <link rel="apple-touch-icon" href="/icon.svg?v=2" />
      </head>
      <body className={`${manrope.className} font-sans min-h-screen bg-slate-50/50 text-slate-900 antialiased relative`}>
        {/* Global Ambient Emerald Glow */}
        <div className="fixed top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="fixed bottom-0 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
