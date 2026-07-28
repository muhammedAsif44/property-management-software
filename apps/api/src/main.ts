import { PropertyType } from '@orvyn/shared-types';
import { formatCurrency } from '@orvyn/utils';

console.log('🚀 Starting Orvyn PMS Backend API...');
console.log(`Sample Property Type: ${PropertyType.APARTMENT}`);
console.log(`Sample Formatted Currency: ${formatCurrency(5000)}`);

// Basic HTTP server placeholder before NestJS modules setup
import http from 'http';

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      success: true,
      message: 'Orvyn PMS Backend API is running',
      timestamp: new Date().toISOString(),
    }),
  );
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
