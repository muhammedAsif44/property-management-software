import React from 'react';
import { formatCurrency } from '@orvyn/utils';
import { PropertyType } from '@orvyn/shared-types';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Orvyn PMS — Customer Web Portal</h1>
      <p>Welcome to the Orvyn Property Management System Customer Portal.</p>
      <div style={{ background: '#f4f4f5', padding: '1rem', borderRadius: '8px' }}>
        <h3>Shared Package Import Verification:</h3>
        <p>Sample Formatted Amount: <strong>{formatCurrency(1250.5, 'USD')}</strong></p>
        <p>Default Property Type: <strong>{PropertyType.APARTMENT}</strong></p>
      </div>
    </main>
  );
}
