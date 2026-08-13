import { PrismaClient, UserRole, ApprovalStatus, CleanlinessStatus, BookingStatus, BookingChannel, StaffStatus, PaymentMode, InvoiceStatus, InvoiceType, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding fresh database with International Guests, Rooms, Bookings, Invoices & Housekeeping...');

  const superAdminEmail = 'admin@orvyn.com';
  const passwordHash = await bcrypt.hash('Admin@123456', 10);

  // 1. Create System Organization
  const systemOrg = await prisma.organization.upsert({
    where: { slug: 'orvyn-system-admin' },
    update: {},
    create: {
      name: 'Orvyn System Administration',
      slug: 'orvyn-system-admin',
      billingEmail: superAdminEmail,
      subscriptionPlan: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
    },
  });

  // 2. Create Super Admin User (mubashir@orvyn.com & admin@orvyn.com)
  const mubashirEmail = 'mubashir@orvyn.com';
  const legacyAdminEmail = 'admin@orvyn.com';

  const mubashirAdmin = await prisma.user.upsert({
    where: { email: mubashirEmail },
    update: {
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      organizationId: systemOrg.id,
      email: mubashirEmail,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
    },
  });

  await prisma.owner.upsert({
    where: { userId: mubashirAdmin.id },
    update: { fullName: 'Mubashir' },
    create: {
      userId: mubashirAdmin.id,
      organizationId: systemOrg.id,
      fullName: 'Mubashir',
    },
  });

  const legacyAdmin = await prisma.user.findUnique({ where: { email: legacyAdminEmail } });
  if (legacyAdmin) {
    await prisma.owner.upsert({
      where: { userId: legacyAdmin.id },
      update: { fullName: 'Mubashir' },
      create: {
        userId: legacyAdmin.id,
        organizationId: systemOrg.id,
        fullName: 'Mubashir',
      },
    });
  }

  // 3. Create Default Invoice Templates
  const defaultTemplates = [
    {
      name: 'Emerald Modern Invoice',
      htmlContent: `<div style="font-family: sans-serif; padding: 24px; border: 2px solid #0B6E4F; border-radius: 16px;">
        <h1 style="color: #0B6E4F; margin-bottom: 4px;">{{propertyName}}</h1>
        <p style="color: #64748b; font-size: 12px; margin-top: 0;">{{propertyAddress}} | Tax ID: {{gstNumber}}</p>
        <hr style="border-color: #e2e8f0; margin: 16px 0;"/>
        <h2 style="font-size: 16px; color: #1e293b;">Tax Invoice #{{invoiceId}}</h2>
        <p>Guest: <strong>{{guestName}}</strong> | Check-in: {{checkInDate}} | Check-out: {{checkOutDate}}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr style="background: #f1f5f9;">
            <th style="text-align: left; padding: 8px;">Description</th>
            <th style="text-align: right; padding: 8px;">Amount</th>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{{roomCategory}} ({{nights}} Nights)</td>
            <td style="text-align: right; padding: 8px; border-bottom: 1px solid #e2e8f0;">{{totalAmount}}</td>
          </tr>
        </table>
        <div style="margin-top: 24px; background: #ecfdf5; padding: 12px; border-radius: 8px; font-size: 12px; color: #065f46;">
          <strong>Payment Info:</strong> Bank: Silicon Valley Bank (A/C: 40921008239) | Online Gateway: Verified
        </div>
      </div>`,
      isDefault: true,
    },
    {
      name: 'Classic Minimalist Invoice',
      htmlContent: `<div style="font-family: serif; padding: 24px; border: 1px solid #cbd5e1;">
        <h1 style="color: #0f172a; margin-bottom: 4px;">{{propertyName}}</h1>
        <p style="font-size: 12px; color: #475569;">Official Guest Billing Statement</p>
        <hr style="border: 1px solid #0f172a; margin: 16px 0;"/>
        <p>Invoice No: <strong>{{invoiceId}}</strong></p>
        <p>Guest Name: {{guestName}}</p>
        <p>Total Due: <strong>{{totalAmount}}</strong></p>
      </div>`,
      isDefault: false,
    },
  ];

  for (const tpl of defaultTemplates) {
    const existing = await prisma.invoiceTemplate.findFirst({
      where: { organizationId: systemOrg.id, name: tpl.name },
    });
    if (!existing) {
      await prisma.invoiceTemplate.create({
        data: {
          organizationId: systemOrg.id,
          name: tpl.name,
          htmlContent: tpl.htmlContent,
          isDefault: tpl.isDefault,
        },
      });
    }
  }

  // 4. Create Owner Account: mubashir@azura.com
  const azuraOwnerEmail = 'mubashir@azura.com';
  const azuraPasswordHash = await bcrypt.hash('12345678', 10);

  const azuraOrg = await prisma.organization.upsert({
    where: { slug: 'azura-resorts-group' },
    update: {},
    create: {
      name: 'Azura Resorts Group',
      slug: 'azura-resorts-group',
      billingEmail: azuraOwnerEmail,
      subscriptionPlan: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
    },
  });

  const azuraUser = await prisma.user.upsert({
    where: { email: azuraOwnerEmail },
    update: {
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      role: UserRole.OWNER,
      passwordHash: azuraPasswordHash,
    },
    create: {
      organizationId: azuraOrg.id,
      email: azuraOwnerEmail,
      passwordHash: azuraPasswordHash,
      role: UserRole.OWNER,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
    },
  });

  const azuraOwner = await prisma.owner.upsert({
    where: { userId: azuraUser.id },
    update: { fullName: 'Mubashir' },
    create: {
      userId: azuraUser.id,
      organizationId: azuraOrg.id,
      fullName: 'Mubashir',
    },
  });

  let azuraProperty = await prisma.property.findFirst({
    where: { organizationId: azuraOrg.id, deletedAt: null },
  });

  if (!azuraProperty) {
    azuraProperty = await prisma.property.create({
      data: {
        organizationId: azuraOrg.id,
        ownerId: azuraOwner.id,
        name: 'Azura Resorts & Spa',
        slug: 'azura-resorts-spa',
        address: '104 Seaside Boulevard, Coastal Bay',
        city: 'Miami',
        state: 'Florida',
        country: 'US',
        currency: 'USD',
        timezone: 'America/New_York',
        status: 'ACTIVE',
        onboardingStep: 6,
      },
    });

    await prisma.propertySettings.create({
      data: {
        propertyId: azuraProperty.id,
        checkInTime: '14:00',
        checkOutTime: '11:00',
        termsAndConditions: 'Standard guest check-in terms and cancellation policy apply.',
      },
    });
  }

  await prisma.owner.update({
    where: { id: azuraOwner.id },
    data: { defaultPropertyId: azuraProperty.id },
  });

  // 5. Populate Staff Members
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager.azura@orvyn.com' },
    update: { approvalStatus: ApprovalStatus.APPROVED, isActive: true },
    create: {
      organizationId: azuraOrg.id,
      email: 'manager.azura@orvyn.com',
      passwordHash: azuraPasswordHash,
      role: UserRole.MANAGER,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
    },
  });

  let mgrMember = await prisma.staffMember.findFirst({
    where: { propertyId: azuraProperty.id, userId: managerUser.id },
  });
  if (!mgrMember) {
    await prisma.staffMember.create({
      data: {
        propertyId: azuraProperty.id,
        userId: managerUser.id,
        role: UserRole.MANAGER,
        status: StaffStatus.ACTIVE,
        invitedByOwnerId: azuraOwner.id,
        joinedAt: new Date(),
      },
    });
  }

  const receptionUser = await prisma.user.upsert({
    where: { email: 'reception.azura@orvyn.com' },
    update: { approvalStatus: ApprovalStatus.APPROVED, isActive: true },
    create: {
      organizationId: azuraOrg.id,
      email: 'reception.azura@orvyn.com',
      passwordHash: azuraPasswordHash,
      role: UserRole.RECEPTION_STAFF,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
    },
  });

  let recMember = await prisma.staffMember.findFirst({
    where: { propertyId: azuraProperty.id, userId: receptionUser.id },
  });
  if (!recMember) {
    await prisma.staffMember.create({
      data: {
        propertyId: azuraProperty.id,
        userId: receptionUser.id,
        role: UserRole.RECEPTION_STAFF,
        status: StaffStatus.ACTIVE,
        invitedByOwnerId: azuraOwner.id,
        joinedAt: new Date(),
      },
    });
  }

  const housekeeperUser = await prisma.user.upsert({
    where: { email: 'cleaner.azura@orvyn.com' },
    update: { approvalStatus: ApprovalStatus.APPROVED, isActive: true },
    create: {
      organizationId: azuraOrg.id,
      email: 'cleaner.azura@orvyn.com',
      passwordHash: azuraPasswordHash,
      role: UserRole.HOUSEKEEPING,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
    },
  });

  let hkMember = await prisma.staffMember.findFirst({
    where: { propertyId: azuraProperty.id, userId: housekeeperUser.id },
  });
  if (!hkMember) {
    await prisma.staffMember.create({
      data: {
        propertyId: azuraProperty.id,
        userId: housekeeperUser.id,
        role: UserRole.HOUSEKEEPING,
        status: StaffStatus.ACTIVE,
        invitedByOwnerId: azuraOwner.id,
        joinedAt: new Date(),
      },
    });
  }

  // 6. Travel Agencies (International OTAs & TAC)
  const agencySpecs = [
    { name: 'Booking.com Partner', contactPerson: 'Sarah Jenkins', email: 'partners@booking.com', phone: '+1 888-850-3958', defaultTacRate: 15 },
    { name: 'Expedia Travel Group', contactPerson: 'David Miller', email: 'support@expediagroup.com', phone: '+1 800-397-3342', defaultTacRate: 12 },
    { name: 'Agoda Global Partner', contactPerson: 'Marcus Vance', email: 'partners@agoda.com', phone: '+65 6329-7537', defaultTacRate: 14 },
    { name: 'Airbnb Luxe Partner', contactPerson: 'Claire Laurent', email: 'luxe@airbnb.com', phone: '+1 415-510-4000', defaultTacRate: 10 },
  ];

  const createdAgencies: Record<string, any> = {};
  for (const a of agencySpecs) {
    let agency = await prisma.agency.findFirst({
      where: { propertyId: azuraProperty.id, name: a.name },
    });
    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          propertyId: azuraProperty.id,
          name: a.name,
          contactPerson: a.contactPerson,
          email: a.email,
          phone: a.phone,
          defaultTacRate: a.defaultTacRate,
          isActive: true,
        },
      });
    }
    createdAgencies[a.name] = agency;
  }

  // 7. Room Types & Physical Units
  const roomTypeSpecs = [
    {
      name: 'Deluxe Ocean View',
      basePrice: 190,
      totalUnits: 4,
      maxOccupancy: 3,
      rooms: ['101', '102', '103', '104'],
    },
    {
      name: 'Premium Sea View',
      basePrice: 240,
      totalUnits: 3,
      maxOccupancy: 3,
      rooms: ['201', '202', '203'],
    },
    {
      name: 'Presidential Suite',
      basePrice: 450,
      totalUnits: 2,
      maxOccupancy: 4,
      rooms: ['301', '302'],
    },
    {
      name: 'Executive Suite',
      basePrice: 270,
      totalUnits: 3,
      maxOccupancy: 3,
      rooms: ['401', '402', '403'],
    },
  ];

  const createdRoomTypes: Record<string, any> = {};
  const createdRoomUnits: Record<string, any> = {};

  for (const rtSpec of roomTypeSpecs) {
    let rt = await prisma.roomType.findFirst({
      where: { propertyId: azuraProperty.id, name: rtSpec.name },
    });

    if (!rt) {
      rt = await prisma.roomType.create({
        data: {
          propertyId: azuraProperty.id,
          name: rtSpec.name,
          basePrice: rtSpec.basePrice,
          totalUnits: rtSpec.totalUnits,
          maxOccupancy: rtSpec.maxOccupancy,
          isActive: true,
        },
      });
    } else {
      await prisma.roomType.update({
        where: { id: rt.id },
        data: { basePrice: rtSpec.basePrice, totalUnits: rtSpec.totalUnits },
      });
    }
    createdRoomTypes[rtSpec.name] = rt;

    // Create Room Units
    for (const unitNum of rtSpec.rooms) {
      let unit = await prisma.roomUnit.findFirst({
        where: { propertyId: azuraProperty.id, unitNumber: unitNum },
      });

      if (!unit) {
        unit = await prisma.roomUnit.create({
          data: {
            propertyId: azuraProperty.id,
            roomTypeId: rt.id,
            unitNumber: unitNum,
            cleanlinessStatus: CleanlinessStatus.CLEAN,
          },
        });
      } else {
        await prisma.roomUnit.update({
          where: { id: unit.id },
          data: { roomTypeId: rt.id, cleanlinessStatus: CleanlinessStatus.CLEAN },
        });
      }
      createdRoomUnits[unitNum] = unit;
    }
  }

  // 8. Clean up all old/stale bookings, invoices, payments, and guests for this property
  console.log('🧹 Cleaning old bookings, invoices, payments, and guests...');
  await prisma.payment.deleteMany({
    where: { booking: { propertyId: azuraProperty.id } },
  });
  await prisma.invoice.deleteMany({
    where: { propertyId: azuraProperty.id },
  });
  await prisma.bookingFacility.deleteMany({
    where: { booking: { propertyId: azuraProperty.id } },
  });
  await prisma.booking.deleteMany({
    where: { propertyId: azuraProperty.id },
  });
  await prisma.housekeepingTask.deleteMany({
    where: { propertyId: azuraProperty.id },
  });
  await prisma.guest.deleteMany({
    where: { propertyId: azuraProperty.id },
  });

  // 9. International Guests
  const internationalGuests = [
    { fullName: 'Liam Smith', phone: '+1 202-555-0143', email: 'liam.smith@example.com', nationality: 'American', totalVisits: 3, totalSpend: 1450 },
    { fullName: 'Emma Watson', phone: '+44 7700 900077', email: 'emma.watson@example.com', nationality: 'British', totalVisits: 2, totalSpend: 980 },
    { fullName: 'Oliver Brown', phone: '+1 415-555-2671', email: 'oliver.brown@example.com', nationality: 'Canadian', totalVisits: 1, totalSpend: 450 },
    { fullName: 'Sophia Martinez', phone: '+34 91 123 4567', email: 'sophia.martinez@example.com', nationality: 'Spanish', totalVisits: 4, totalSpend: 2180 },
    { fullName: 'Lucas Müller', phone: '+49 30 123456', email: 'lucas.muller@example.com', nationality: 'German', totalVisits: 2, totalSpend: 960 },
    { fullName: 'Elena Rossi', phone: '+39 06 698 1234', email: 'elena.rossi@example.com', nationality: 'Italian', totalVisits: 1, totalSpend: 520 },
    { fullName: 'Alexander Clark', phone: '+61 2 9876 5432', email: 'alex.clark@example.com', nationality: 'Australian', totalVisits: 3, totalSpend: 1680 },
    { fullName: 'Chloe Dubois', phone: '+33 1 42 68 55 00', email: 'chloe.dubois@example.com', nationality: 'French', totalVisits: 2, totalSpend: 890 },
    { fullName: 'William Davies', phone: '+44 20 7946 0912', email: 'william.davies@example.com', nationality: 'British', totalVisits: 1, totalSpend: 380 },
    { fullName: 'Isabella Garcia', phone: '+1 305-555-0199', email: 'isabella.garcia@example.com', nationality: 'American', totalVisits: 2, totalSpend: 1100 },
  ];

  const createdGuestsMap: Record<string, any> = {};
  for (const g of internationalGuests) {
    const guest = await prisma.guest.create({
      data: {
        propertyId: azuraProperty.id,
        fullName: g.fullName,
        phone: g.phone,
        email: g.email,
        nationality: g.nationality,
        totalVisits: g.totalVisits,
        totalSpend: g.totalSpend,
      },
    });
    createdGuestsMap[g.fullName] = guest;
  }

  // 10. Create Fresh Realistic Bookings
  const today = new Date();
  const getOffsetDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const bookingSeedData = [
    {
      guestName: 'Liam Smith',
      roomTypeName: 'Deluxe Ocean View',
      unitNumber: '101',
      inDays: 0,
      outDays: 2,
      status: BookingStatus.CHECKED_IN,
      channel: BookingChannel.WALK_IN,
      baseAmount: 380,
      advancePaid: 380,
      balanceDue: 0,
      paymentMode: PaymentMode.CREDIT_CARD,
    },
    {
      guestName: 'Emma Watson',
      roomTypeName: 'Deluxe Ocean View',
      unitNumber: '102',
      inDays: 1,
      outDays: 4,
      status: BookingStatus.CONFIRMED,
      channel: BookingChannel.OTA,
      agencyName: 'Booking.com Partner',
      baseAmount: 570,
      advancePaid: 200,
      balanceDue: 370,
      paymentMode: PaymentMode.ONLINE,
    },
    {
      guestName: 'Oliver Brown',
      roomTypeName: 'Deluxe Ocean View',
      unitNumber: '103',
      inDays: 0,
      outDays: 1,
      status: BookingStatus.CHECKED_IN,
      channel: BookingChannel.WALK_IN,
      baseAmount: 190,
      advancePaid: 190,
      balanceDue: 0,
      paymentMode: PaymentMode.CASH,
    },
    {
      guestName: 'Sophia Martinez',
      roomTypeName: 'Deluxe Ocean View',
      unitNumber: '104',
      inDays: 3,
      outDays: 6,
      status: BookingStatus.CONFIRMED,
      channel: BookingChannel.OTA,
      agencyName: 'Expedia Travel Group',
      baseAmount: 570,
      advancePaid: 570,
      balanceDue: 0,
      paymentMode: PaymentMode.ONLINE,
    },
    {
      guestName: 'Lucas Müller',
      roomTypeName: 'Premium Sea View',
      unitNumber: '201',
      inDays: 0,
      outDays: 3,
      status: BookingStatus.CHECKED_IN,
      channel: BookingChannel.WEBSITE,
      baseAmount: 720,
      advancePaid: 720,
      balanceDue: 0,
      paymentMode: PaymentMode.BANK_TRANSFER,
    },
    {
      guestName: 'Elena Rossi',
      roomTypeName: 'Premium Sea View',
      unitNumber: '202',
      inDays: 2,
      outDays: 5,
      status: BookingStatus.CONFIRMED,
      channel: BookingChannel.OTA,
      agencyName: 'Agoda Global Partner',
      baseAmount: 720,
      advancePaid: 300,
      balanceDue: 420,
      paymentMode: PaymentMode.ONLINE,
    },
    {
      guestName: 'Alexander Clark',
      roomTypeName: 'Presidential Suite',
      unitNumber: '301',
      inDays: 1,
      outDays: 3,
      status: BookingStatus.CONFIRMED,
      channel: BookingChannel.PHONE,
      baseAmount: 900,
      advancePaid: 900,
      balanceDue: 0,
      paymentMode: PaymentMode.CREDIT_CARD,
    },
    {
      guestName: 'Chloe Dubois',
      roomTypeName: 'Executive Suite',
      unitNumber: '401',
      inDays: 4,
      outDays: 7,
      status: BookingStatus.CONFIRMED,
      channel: BookingChannel.OTA,
      agencyName: 'Booking.com Partner',
      baseAmount: 810,
      advancePaid: 810,
      balanceDue: 0,
      paymentMode: PaymentMode.ONLINE,
    },
    {
      guestName: 'William Davies',
      roomTypeName: 'Executive Suite',
      unitNumber: '402',
      inDays: 0,
      outDays: 2,
      status: BookingStatus.CHECKED_IN,
      channel: BookingChannel.WALK_IN,
      baseAmount: 540,
      advancePaid: 540,
      balanceDue: 0,
      paymentMode: PaymentMode.CREDIT_CARD,
    },
    {
      guestName: 'Isabella Garcia',
      roomTypeName: 'Deluxe Ocean View',
      unitNumber: '101',
      inDays: -5,
      outDays: -2,
      status: BookingStatus.CHECKED_OUT,
      channel: BookingChannel.AGENCY,
      agencyName: 'Airbnb Luxe Partner',
      baseAmount: 570,
      advancePaid: 570,
      balanceDue: 0,
      paymentMode: PaymentMode.ONLINE,
    },
  ];

  let invoiceSeq = 1;

  for (const b of bookingSeedData) {
    const guest = createdGuestsMap[b.guestName];
    const rt = createdRoomTypes[b.roomTypeName];
    const unit = createdRoomUnits[b.unitNumber];
    const agency = b.agencyName ? createdAgencies[b.agencyName] : null;

    const createdBooking = await prisma.booking.create({
      data: {
        propertyId: azuraProperty.id,
        guestId: guest.id,
        roomTypeId: rt.id,
        roomUnitId: unit?.id,
        agencyId: agency?.id,
        checkInDate: getOffsetDate(b.inDays),
        checkOutDate: getOffsetDate(b.outDays),
        status: b.status,
        channel: b.channel,
        baseAmount: b.baseAmount,
        totalAmount: b.baseAmount,
        advancePaid: b.advancePaid,
        balanceDue: b.balanceDue,
        createdByUserId: azuraUser.id,
      },
    });

    // Create Invoice
    const invoiceNum = `INV-2026-${String(invoiceSeq).padStart(3, '0')}`;
    invoiceSeq++;

    await prisma.invoice.create({
      data: {
        propertyId: azuraProperty.id,
        bookingId: createdBooking.id,
        invoiceNumber: invoiceNum,
        status: InvoiceStatus.READY,
        type: InvoiceType.FINAL,
        generatedById: azuraUser.id,
        generatedAt: new Date(),
      },
    });

    // Create Payment record if advancePaid > 0
    if (b.advancePaid > 0) {
      await prisma.payment.create({
        data: {
          bookingId: createdBooking.id,
          amount: b.advancePaid,
          mode: b.paymentMode,
          referenceNote: `Payment for booking #${createdBooking.id.slice(0, 8)}`,
          createdByUserId: azuraUser.id,
        },
      });
    }

    // If room is Dirty or checked out, set unit status & create housekeeping task
    if (b.status === BookingStatus.CHECKED_OUT) {
      if (unit) {
        await prisma.roomUnit.update({
          where: { id: unit.id },
          data: { cleanlinessStatus: CleanlinessStatus.DIRTY },
        });

        await prisma.housekeepingTask.create({
          data: {
            propertyId: azuraProperty.id,
            roomUnitId: unit.id,
            status: TaskStatus.PENDING,
            reportedIssue: 'Turnover cleaning after guest checkout.',
            assignedToUserId: housekeeperUser.id,
          },
        });
      }
    }
  }

  console.log(`✅ Super Admin created: ${mubashirAdmin.email}`);
  console.log(`✅ Owner created: ${azuraUser.email}`);
  console.log(`✅ Successfully seeded 10 International Guests, 12 Rooms, 10 Bookings, Invoices, Payments, and Housekeeping Tasks!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
