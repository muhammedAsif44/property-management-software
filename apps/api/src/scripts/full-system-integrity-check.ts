import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🔍 RUNNING COMPREHENSIVE SYSTEM & DATA INTEGRITY CHECK');
  console.log('====================================================\n');

  let issuesFound = 0;

  // 1. Audit Room Types vs Physical Units
  const properties = await prisma.property.findMany({
    where: { deletedAt: null },
    include: {
      roomTypes: {
        where: { isActive: true },
        include: { roomUnits: true },
      },
    },
  });

  for (const prop of properties) {
    console.log(`🏠 Property: ${prop.name}`);
    for (const rt of prop.roomTypes) {
      console.log(`   - Room Category: "${rt.name}" | Total Units Configured: ${rt.totalUnits} | Physical Units in DB: ${rt.roomUnits.length}`);
      if (rt.roomUnits.length < rt.totalUnits) {
        console.log(`     ⚠️ Note: Physical unit count (${rt.roomUnits.length}) < totalUnits (${rt.totalUnits}).`);
      }
    }
  }

  // 2. Audit Booking Overlaps on Physical Room Units
  console.log('\n----------------------------------------------------');
  console.log('🔑 AUDITING PHYSICAL ROOM UNIT OVERLAPS');
  console.log('----------------------------------------------------');

  const activeBookings = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      deletedAt: null,
      roomUnitId: { not: null },
    },
    include: {
      roomUnit: true,
      guest: true,
      roomType: true,
    },
  });

  const unitOccupancy: Record<string, Array<{ id: string; guest: string; checkIn: string; checkOut: string; unitNumber: string }>> = {};

  for (const b of activeBookings) {
    if (!b.roomUnitId) continue;
    const list = unitOccupancy[b.roomUnitId] || [];
    list.push({
      id: b.id,
      guest: b.guest.fullName,
      checkIn: b.checkInDate.toISOString().split('T')[0],
      checkOut: b.checkOutDate.toISOString().split('T')[0],
      unitNumber: b.roomUnit?.unitNumber || 'Unknown',
    });
    unitOccupancy[b.roomUnitId] = list;
  }

  for (const [unitId, bookings] of Object.entries(unitOccupancy)) {
    if (bookings.length <= 1) continue;
    for (let i = 0; i < bookings.length; i++) {
      for (let j = i + 1; j < bookings.length; j++) {
        const b1 = bookings[i];
        const b2 = bookings[j];
        if (b1.checkIn < b2.checkOut && b1.checkOut > b2.checkIn) {
          console.log(`❌ PHYSICAL UNIT OVERLAP CRITICAL ISSUE: Unit ${b1.unitNumber} has overlapping stays:`);
          console.log(`   Guest 1: ${b1.guest} (${b1.checkIn} to ${b1.checkOut})`);
          console.log(`   Guest 2: ${b2.guest} (${b2.checkIn} to ${b2.checkOut})`);
          issuesFound++;
        }
      }
    }
  }

  if (issuesFound === 0) {
    console.log('🟢 0 Physical Room Unit overlaps detected! All room unit assignments are 100% clean.');
  }

  // 3. Audit Category-Level Capacity Overbookings
  console.log('\n----------------------------------------------------');
  console.log('📊 AUDITING CATEGORY-LEVEL CAPACITY OVERBOOKINGS');
  console.log('----------------------------------------------------');

  for (const prop of properties) {
    for (const rt of prop.roomTypes) {
      const rtBookings = await prisma.booking.findMany({
        where: {
          roomTypeId: rt.id,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          deletedAt: null,
        },
      });

      const dayCounts: Record<string, number> = {};
      for (const b of rtBookings) {
        const inDate = new Date(b.checkInDate);
        const outDate = new Date(b.checkOutDate);
        const inUtc = Date.UTC(inDate.getUTCFullYear(), inDate.getUTCMonth(), inDate.getUTCDate());
        const outUtc = Date.UTC(outDate.getUTCFullYear(), outDate.getUTCMonth(), outDate.getUTCDate());
        let currentTs = inUtc;
        while (currentTs < outUtc) {
          const dateStr = new Date(currentTs).toISOString().split('T')[0];
          dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1;
          currentTs += 86400000;
        }
      }

      let categoryOverbookings = 0;
      for (const [dateStr, count] of Object.entries(dayCounts)) {
        if (count > rt.totalUnits) {
          console.log(`❌ OVERBOOKING ALERT: ${rt.name} on ${dateStr} has ${count} bookings vs ${rt.totalUnits} capacity!`);
          categoryOverbookings++;
          issuesFound++;
        }
      }

      if (categoryOverbookings === 0) {
        console.log(`🟢 Room Category "${rt.name}": 0 Overbookings across all date buckets.`);
      }
    }
  }

  console.log('\n====================================================');
  if (issuesFound === 0) {
    console.log('🎉 SYSTEM INTEGRITY CHECK COMPLETE: 0 ISSUES FOUND! 100% HEALTHY.');
  } else {
    console.log(`⚠️ SYSTEM INTEGRITY CHECK COMPLETE: ${issuesFound} ISSUES FOUND.`);
  }
  console.log('====================================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
