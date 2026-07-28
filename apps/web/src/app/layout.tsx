import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Orvyn PMS - Customer Web Portal',
  description: 'Manage your property, leases, and payments easily with Orvyn PMS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">{children}</body>
    </html>
  );
}
