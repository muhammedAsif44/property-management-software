import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Orvyn PMS - Admin Panel',
  description: 'Enterprise Admin Dashboard for Orvyn Property Management System',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">{children}</body>
    </html>
  );
}
