import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import { BookingChannel } from '@prisma/client';

async function createSalimKumarBooking() {
  console.log('🚀 Creating New Booking for Guest "salim kumar" (Auto-formatted to Salim Kumar)...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const prisma = app.get(PrismaService);

    // 1. Find active user & property
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('❌ No user found in database.');
      process.exit(1);
    }

    const property = await prisma.property.findFirst({
      where: { deletedAt: null },
    });

    if (!property) {
      console.error('❌ No property found in database.');
      process.exit(1);
    }

    // 2. Find active room type & unit
    let roomType = await prisma.roomType.findFirst({
      where: { propertyId: property.id },
    });

    if (!roomType) {
      roomType = await prisma.roomType.create({
        data: {
          propertyId: property.id,
          name: 'Executive Suite',
          basePrice: 4500,
          maxOccupancy: 2,
          totalUnits: 5,
        },
      });
    }

    let roomUnit = await prisma.roomUnit.findFirst({
      where: { roomTypeId: roomType.id },
    });

    if (!roomUnit) {
      roomUnit = await prisma.roomUnit.create({
        data: {
          propertyId: property.id,
          roomTypeId: roomType.id,
          unitNumber: '101',
          cleanlinessStatus: 'CLEAN',
        },
      });
    }

    // 3. Upsert Guest Profile (salim kumar)
    const guestPhone = '+91 9895123456';
    const guestEmail = 'salim.kumar@azura.com';
    const rawFullName = 'salim kumar';

    let guest = await prisma.guest.findFirst({
      where: {
        propertyId: property.id,
        OR: [{ phone: guestPhone }, { email: guestEmail }],
      },
    });

    if (guest) {
      guest = await prisma.guest.update({
        where: { id: guest.id },
        data: {
          fullName: rawFullName,
          totalVisits: { increment: 1 },
          totalSpend: { increment: 14500 },
          lastStayAt: new Date(),
        },
      });
    } else {
      guest = await prisma.guest.create({
        data: {
          propertyId: property.id,
          fullName: rawFullName,
          phone: guestPhone,
          email: guestEmail,
          nationality: 'Indian',
          totalVisits: 1,
          totalSpend: 14500,
          firstStayAt: new Date(),
          lastStayAt: new Date(),
        },
      });
    }

    // 4. Create Booking Reservation
    const today = new Date();
    const checkInDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const checkOutDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);

    const booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        createdByUserId: user.id,
        roomTypeId: roomType.id,
        roomUnitId: roomUnit.id,
        guestId: guest.id,
        checkInDate,
        checkOutDate,
        totalAmount: 14500,
        baseAmount: 12288,
        gstAmount: 2212,
        status: 'CONFIRMED',
        channel: BookingChannel.WALK_IN,
      },
    });

    console.log('---------------------------------------------------------');
    console.log('✅ SUCCESS! Booking & Guest created in PostgreSQL DB:');
    console.log(`   • Booking ID: ${booking.id}`);
    console.log(`   • Guest Name in DB: "${guest.fullName}"`);
    console.log(`   • Guest Name on UI: "Salim Kumar" (formatted via formatDisplayName)`);
    console.log(`   • Contact Phone: ${guest.phone}`);
    console.log(`   • Total Visits: ${guest.totalVisits}`);
    console.log(`   • Total Spend: ₹${Number(guest.totalSpend)}`);
    console.log('---------------------------------------------------------\n');
    console.log('🎉 Open http://localhost:3000/guests in your browser to view the new guest profile!');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error executing script:', error);
    await app.close();
    process.exit(1);
  }
}

createSalimKumarBooking();
