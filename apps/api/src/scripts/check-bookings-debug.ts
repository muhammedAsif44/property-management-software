import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roomTypes = await prisma.roomType.findMany();
  console.log('=== ROOM TYPES ===');
  console.log(roomTypes.map(r => ({ id: r.id, name: r.name, totalUnits: r.totalUnits })));

  const bookings = await prisma.booking.findMany({
    where: { deletedAt: null },
    include: { roomType: true, guest: true },
  });

  console.log('\n=== ALL BOOKINGS ===');
  for (const b of bookings) {
    console.log({
      id: b.id,
      roomType: b.roomType?.name,
      guest: b.guest?.fullName,
      checkIn: b.checkInDate.toISOString().split('T')[0],
      checkOut: b.checkOutDate.toISOString().split('T')[0],
      status: b.status,
    });
  }

  // Count occupied per day for Executive Suite & Deluxe Ocean View
  for (const rt of roomTypes) {
    console.log(`\n--- Occupancy map for ${rt.name} (totalUnits: ${rt.totalUnits}) ---`);
    const rtBookings = bookings.filter(b => b.roomTypeId === rt.id && b.status !== 'CANCELLED');
    const dayCounts: Record<string, number> = {};
    for (const b of rtBookings) {
      const inDate = new Date(b.checkInDate);
      const outDate = new Date(b.checkOutDate);
      const inUtc = Date.UTC(inDate.getUTCFullYear(), inDate.getUTCMonth(), inDate.getUTCDate());
      const outUtc = Date.UTC(outDate.getUTCFullYear(), outDate.getUTCMonth(), outDate.getUTCDate());
      let currentTs = inUtc;
      while (currentTs < outUtc) {
        const dStr = new Date(currentTs).toISOString().split('T')[0];
        dayCounts[dStr] = (dayCounts[dStr] || 0) + 1;
        currentTs += 86400000;
      }
    }
    for (const [dateStr, count] of Object.entries(dayCounts)) {
      if (count > rt.totalUnits) {
        console.log(`❌ OVERBOOKED ON ${dateStr}: ${count} bookings vs ${rt.totalUnits} units!`);
      } else {
        console.log(`  ${dateStr}: ${count}/${rt.totalUnits} booked`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
