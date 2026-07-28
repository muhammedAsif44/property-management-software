import React from 'react';

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
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}
