import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import { InvoicesService } from '../modules/invoices/invoices.service';

async function createTestBookingAndPdf() {
  console.log('🚀 Creating a brand new Booking & triggering Background PDF Generation...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const prisma = app.get(PrismaService);
    const invoicesService = app.get(InvoicesService);

    // 1. Get or create Super Admin User & Organization
    let user = await prisma.user.findFirst({
      include: { organization: true },
    });

    if (!user) {
      console.error('❌ No user found. Please run seed script first.');
      process.exit(1);
    }

    // 2. Get Property
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

    // 3. Get Room Type & Room Unit
    let roomType = await prisma.roomType.findFirst({
      where: { propertyId: property.id },
    });

    if (!roomType) {
      roomType = await prisma.roomType.findFirst();
    }

    let roomUnit = await prisma.roomUnit.findFirst({
      where: { roomTypeId: roomType?.id },
    });

    // 4. Get or Create Guest
    let guest = await prisma.guest.findFirst({
      where: { email: { contains: '@' } },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          fullName: 'Alexander Wright VIP',
          email: `alex.wright.${Date.now()}@example.com`,
          phone: '+91 98765 43210',
        } as any,
      });
    }

    // 5. Create Brand New Booking
    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 3);

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
        children: 1,
        baseAmount: 37500,
        totalAmount: 37500,
        advancePaid: 37500,
        balanceDue: 0,
        createdByUser: { connect: { id: user.id } },
      } as any,
    });

    console.log('✅ NEW BOOKING CREATED SUCCESSFULLY!');
    console.log('   Booking ID:', booking.id);
    console.log('   Guest Name:', guest.fullName);
    console.log('   Property:', property.name);
    console.log('   Total Net Amount: ₹' + Number(booking.totalAmount).toLocaleString('en-IN'));

    // 6. Issue Invoice (Pushes PDF generation job to BullMQ queue)
    console.log('\n📄 Issuing Invoice & Pushing Job to BullMQ Queue...');
    const result = await invoicesService.issueInvoice(user.id, booking.id);

    console.log('   Invoice Issued Response:', result.message);
    console.log('   Invoice Number:', result.invoice.invoiceNumber);
    console.log('   Job ID:', result.invoice.jobId);
    console.log('   Current Status:', result.invoice.status);

    // 7. Wait 6 seconds for BullMQ Worker to process PDF and upload to Cloudinary
    console.log('\n⏳ Waiting 6 seconds for background BullMQ Worker & Cloudinary upload...');
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // 8. Fetch updated Invoice from DB
    const finalInvoice = await prisma.invoice.findUnique({
      where: { id: result.invoice.id },
    });

    console.log('\n🎉 FINAL INVOICE & PDF STATUS:');
    console.log('   Invoice Number:', finalInvoice?.invoiceNumber);
    console.log('   Status:', finalInvoice?.status);
    console.log('   Cloudinary Public ID:', finalInvoice?.cloudinaryPublicId);
    console.log('   File Size:', finalInvoice?.fileSize ? `${finalInvoice.fileSize} bytes` : 'N/A');
    console.log('   LIVE CLOUDINARY PDF URL:', finalInvoice?.pdfUrl);

    console.log('\n✨ You can now view this booking and download its invoice live in your web app at: http://localhost:3000/bookings');
  } catch (err: any) {
    console.error('❌ Error creating test booking:', err?.message || err);
  } finally {
    await app.close();
    process.exit(0);
  }
}

createTestBookingAndPdf();
