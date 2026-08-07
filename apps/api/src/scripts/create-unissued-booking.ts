import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';

async function createUnissuedBooking() {
  console.log('🚀 Creating a brand new Booking WITHOUT an issued invoice...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const prisma = app.get(PrismaService);

    // 1. Get User & Property
    let user = await prisma.user.findFirst({
      include: { organization: true },
    });

    if (!user) {
      console.error('❌ No user found.');
      process.exit(1);
    }

    let property = await prisma.property.findFirst({
      where: { organizationId: user.organizationId, deletedAt: null },
    });

    if (!property) {
      property = await prisma.property.findFirst();
    }

    if (!property) {
      console.error('❌ No property found.');
      process.exit(1);
    }

    // 2. Get Room Type & Room Unit
    let roomType = await prisma.roomType.findFirst({
      where: { propertyId: property.id },
    });

    if (!roomType) {
      roomType = await prisma.roomType.findFirst();
    }

    let roomUnit = await prisma.roomUnit.findFirst({
      where: { roomTypeId: roomType?.id },
    });

    // 3. Create New Guest
    const guest = await prisma.guest.create({
      data: {
        property: { connect: { id: property.id } },
        fullName: 'Sophia Martinez & Family',
        email: `sophia.martinez.${Date.now()}@example.com`,
        phone: '+1 415 555 0199',
      } as any,
    });

    // 4. Create Brand New Unissued Booking
    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 4);

    const booking = await prisma.booking.create({
      data: {
        property: { connect: { id: property.id } },
        roomType: { connect: { id: roomType!.id } },
        guest: { connect: { id: guest.id } },
        ...(roomUnit ? { roomUnit: { connect: { id: roomUnit.id } } } : {}),
        channel: 'WEBSITE' as any,
        status: 'CONFIRMED',
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: 2,
        children: 2,
        baseAmount: 48000,
        totalAmount: 48000,
        advancePaid: 48000,
        balanceDue: 0,
        createdByUser: { connect: { id: user.id } },
      } as any,
    });

    console.log('✅ BRAND NEW UNISSUED BOOKING CREATED SUCCESSFULLY!');
    console.log('   Booking ID:', booking.id);
    console.log('   Guest Name:', guest.fullName);
    console.log('   Property:', property.name);
    console.log('   Total Net Amount: ₹' + Number(booking.totalAmount).toLocaleString('en-IN'));
    console.log('   Invoice Status: NOT ISSUED YET (0 Invoices in Database)');

    console.log('\n✨ You can now test this booking live in your browser:');
    console.log('   1. Open: http://localhost:3000/invoices');
    console.log(`   2. Look for guest: "${guest.fullName}"`);
    console.log('   3. Click "Preview" -> You will see the green "Issue Final Invoice" button!');
    console.log('   4. Click "Issue Final Invoice" -> Watch it process and transform into "Download PDF" live!');
  } catch (err: any) {
    console.error('❌ Error creating unissued booking:', err?.message || err);
  } finally {
    await app.close();
    process.exit(0);
  }
}

createUnissuedBooking();
