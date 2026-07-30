import React from 'react';
import { Manrope, Noto_Sans_Malayalam } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

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
      <body className={`${manrope.className} font-sans min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
