import { PrismaClient, BookingChannel, BookingStatus, MealPlan } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Cleaning up existing bookings, room units, and room types...');

  // 1. Delete dependent relations first
  await prisma.bookingFacility.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.bookingDeletionRequest.deleteMany({});
  await prisma.housekeepingTask.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.roomUnit.deleteMany({});
  await prisma.roomType.deleteMany({});

  console.log('✅ Cleaned up old bookings & room inventory.');

  // Find active property or fallback to first property
  const property = await prisma.property.findFirst();
  if (!property) {
    throw new Error('No property found in database to seed rooms & bookings.');
  }

  // Find first user to set createdByUserId
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('No user found in database.');
  }

  console.log(`🏨 Seeding room categories & units for property: ${property.name} (${property.id})`);

  // 2. Create Category 1: Executive Suite
  const execSuite = await prisma.roomType.create({
    data: {
      propertyId: property.id,
      name: 'Executive Suite',
      basePrice: 4500,
      totalUnits: 3,
      maxOccupancy: 2,
      sortOrder: 1,
      isActive: true,
    },
  });

  const execUnits = await Promise.all([
    prisma.roomUnit.create({
      data: {
        propertyId: property.id,
        roomTypeId: execSuite.id,
        unitNumber: '101',
        floor: '1st Floor',
        cleanlinessStatus: 'CLEAN',
      },
    }),
    prisma.roomUnit.create({
      data: {
        propertyId: property.id,
        roomTypeId: execSuite.id,
        unitNumber: '102',
        floor: '1st Floor',
        cleanlinessStatus: 'CLEAN',
      },
    }),
    prisma.roomUnit.create({
      data: {
        propertyId: property.id,
        roomTypeId: execSuite.id,
        unitNumber: '103',
        floor: '1st Floor',
        cleanlinessStatus: 'DIRTY',
      },
    }),
  ]);

  // 3. Create Category 2: Deluxe Ocean View
  const deluxeOcean = await prisma.roomType.create({
    data: {
      propertyId: property.id,
      name: 'Deluxe Ocean View',
      basePrice: 7500,
      totalUnits: 3,
      maxOccupancy: 3,
      sortOrder: 2,
      isActive: true,
    },
  });

  const deluxeUnits = await Promise.all([
    prisma.roomUnit.create({
      data: {
        propertyId: property.id,
        roomTypeId: deluxeOcean.id,
        unitNumber: '201',
        floor: '2nd Floor',
        cleanlinessStatus: 'CLEAN',
      },
    }),
    prisma.roomUnit.create({
      data: {
        propertyId: property.id,
        roomTypeId: deluxeOcean.id,
        unitNumber: '202',
        floor: '2nd Floor',
        cleanlinessStatus: 'CLEAN',
      },
    }),
    prisma.roomUnit.create({
      data: {
        propertyId: property.id,
        roomTypeId: deluxeOcean.id,
        unitNumber: '203',
        floor: '2nd Floor',
        cleanlinessStatus: 'INSPECTED',
      },
    }),
  ]);

  console.log('✅ Created 2 Room Categories and 6 Room Units.');

  // 4. Create Sample Guests
  const guest1 = await prisma.guest.upsert({
    where: { propertyId_phone: { propertyId: property.id, phone: '9843744243' } },
    update: { fullName: 'Asif Mohamed' },
    create: {
      propertyId: property.id,
      fullName: 'Asif Mohamed',
      phone: '9843744243',
      email: 'asif.teddchon@gmail.com',
      nationality: 'IN',
    },
  });

  const guest2 = await prisma.guest.upsert({
    where: { propertyId_phone: { propertyId: property.id, phone: '984634633' } },
    update: { fullName: 'Niyaf Ahmed' },
    create: {
      propertyId: property.id,
      fullName: 'Niyaf Ahmed',
      phone: '984634633',
      email: 'niyaf@gmail.com',
      nationality: 'IN',
    },
  });

  const guest3 = await prisma.guest.upsert({
    where: { propertyId_phone: { propertyId: property.id, phone: '9876543210' } },
    update: { fullName: 'Rahul Sharma' },
    create: {
      propertyId: property.id,
      fullName: 'Rahul Sharma',
      phone: '9876543210',
      email: 'rahul.sharma@example.com',
      nationality: 'IN',
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const addDays = (d: Date, n: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + n);
    return res;
  };

  // 5. Seed Sample Bookings
  console.log('📋 Seeding fresh bookings...');

  // Booking 1: Checked-In under Executive Suite (Room 101)
  await prisma.booking.create({
    data: {
      propertyId: property.id,
      guestId: guest1.id,
      roomTypeId: execSuite.id,
      roomUnitId: execUnits[0].id,
      channel: BookingChannel.WALK_IN,
      status: BookingStatus.CHECKED_IN,
      checkInDate: today,
      checkOutDate: addDays(today, 3),
      adults: 2,
      mealPlan: MealPlan.CP,
      baseAmount: 13500,
      totalAmount: 13500,
      advancePaid: 13500,
      balanceDue: 0,
      createdByUserId: user.id,
    },
  });

  // Booking 2: Confirmed under Deluxe Ocean View (Room 201)
  await prisma.booking.create({
    data: {
      propertyId: property.id,
      guestId: guest2.id,
      roomTypeId: deluxeOcean.id,
      roomUnitId: deluxeUnits[0].id,
      channel: BookingChannel.AGENCY,
      status: BookingStatus.CONFIRMED,
      checkInDate: addDays(today, 1),
      checkOutDate: addDays(today, 4),
      adults: 2,
      mealPlan: MealPlan.MAP,
      baseAmount: 22500,
      totalAmount: 22500,
      advancePaid: 7500,
      balanceDue: 15000,
      createdByUserId: user.id,
    },
  });

  // Booking 3: Unassigned Confirmed under Executive Suite (No Room Unit assigned yet)
  await prisma.booking.create({
    data: {
      propertyId: property.id,
      guestId: guest3.id,
      roomTypeId: execSuite.id,
      roomUnitId: null,
      channel: BookingChannel.PHONE,
      status: BookingStatus.CONFIRMED,
      checkInDate: addDays(today, 2),
      checkOutDate: addDays(today, 5),
      adults: 1,
      mealPlan: MealPlan.EP,
      baseAmount: 13500,
      totalAmount: 13500,
      advancePaid: 3500,
      balanceDue: 10000,
      createdByUserId: user.id,
    },
  });

  console.log('🎉 Successfully reset & reseeded room categories, units, and bookings!');
}

main()
  .catch((e) => {
    console.error('❌ Reseed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
