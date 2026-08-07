import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up surplus test bookings to fix database overbooking...');

  // Cancel duplicate test bookings for Executive Suite (id: 20f37a66-c142-4673-b47e-9d43e07178a4 & 952b0a07-b115-4927-bebc-c94148c2e7e6)
  const cancelledCount = await prisma.booking.updateMany({
    where: {
      id: {
        in: [
          '20f37a66-c142-4673-b47e-9d43e07178a4', // Duplicate niyaf booking
          '952b0a07-b115-4927-bebc-c94148c2e7e6', // Duplicate Rahul Sharma booking
        ],
      },
    },
    data: {
      status: 'CANCELLED',
    },
  });

  console.log(`✅ Cancelled ${cancelledCount.count} overbooked duplicate test bookings.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
