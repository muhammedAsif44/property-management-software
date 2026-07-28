import React from 'react';
import { UserRole } from '@orvyn/shared-types';
import { PERMISSIONS } from '@orvyn/config';

export default function AdminHomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Orvyn PMS — Admin Panel</h1>
      <p>System Administration and Management Portal.</p>
      <div style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '8px' }}>
        <h3>Role & Permissions Verification:</h3>
        <p>Super Admin Role: <strong>{UserRole.SUPER_ADMIN}</strong></p>
        <p>Sample Permission Key: <strong>{PERMISSIONS.BOOKING_CREATE}</strong></p>
      </div>
    </main>
  );
}
