import React from 'react';

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
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}
