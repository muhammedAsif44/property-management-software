import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== DEEP RESEARCH ON ROOM UNITS & BOOKINGS ===\n');

  const property = await prisma.property.findFirst({
    where: { deletedAt: null },
  });

  if (!property) {
    console.log('No property found.');
    return;
  }

  console.log(`Property: ${property.name} (${property.id})\n`);

  const roomTypes = await prisma.roomType.findMany({
    where: { propertyId: property.id },
    include: {
      roomUnits: true,
    },
  });

  for (const rt of roomTypes) {
    console.log(`\n--- Room Type: ${rt.name} (ID: ${rt.id}) ---`);
    console.log(`Total Units Count (totalUnits field): ${rt.totalUnits}`);
    console.log(`Physical Room Units in DB: ${rt.roomUnits.length}`);
    for (const u of rt.roomUnits) {
      console.log(`   - Unit: ${u.unitNumber} (ID: ${u.id}), Status: ${u.cleanlinessStatus}`);
    }

    const bookings = await prisma.booking.findMany({
      where: {
        roomTypeId: rt.id,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        deletedAt: null,
      },
      include: {
        guest: true,
        roomUnit: true,
      },
    });

    console.log(`\nActive Bookings for ${rt.name}: ${bookings.length}`);
    for (const b of bookings) {
      console.log({
        bookingId: b.id,
        guest: b.guest.fullName,
        checkIn: b.checkInDate.toISOString().split('T')[0],
        checkOut: b.checkOutDate.toISOString().split('T')[0],
        assignedUnit: b.roomUnit ? b.roomUnit.unitNumber : 'UNASSIGNED (null)',
      });
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
