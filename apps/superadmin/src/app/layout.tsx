import React from 'react';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata = {
  title: 'Orvyn PMS - Super Admin Portal',
  description: 'Super Admin Governance & Organization Approval Portal powered by Orvyn Labs',
};

export default function AdminLayout({
  children,
}: {
  children: any;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className={`${manrope.className} font-sans min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
