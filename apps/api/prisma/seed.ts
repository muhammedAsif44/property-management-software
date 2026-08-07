import { PrismaClient, UserRole, ApprovalStatus, CleanlinessStatus, BookingStatus, BookingChannel, StaffStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Super Admin user & Invoice Templates...');

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
        <p style="color: #64748b; font-size: 12px; margin-top: 0;">{{propertyAddress}} | GSTIN: {{gstNumber}}</p>
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
          <strong>Payment Info:</strong> UPI ID: {{upiId}} | Bank: {{bankName}} (A/C: {{accountNumber}})
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
        address: 'Beach Road, Kovalam',
        city: 'Trivandrum',
        state: 'Kerala',
        country: 'IN',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
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

  // Ensure Room Types
  let deluxeRoomType = await prisma.roomType.findFirst({
    where: { propertyId: azuraProperty.id, name: 'Deluxe Ocean View' },
  });

  if (!deluxeRoomType) {
    deluxeRoomType = await prisma.roomType.create({
      data: {
        propertyId: azuraProperty.id,
        name: 'Deluxe Ocean View',
        basePrice: 5500,
        totalUnits: 3,
        maxOccupancy: 3,
        isActive: true,
      },
    });
  }

  let suiteRoomType = await prisma.roomType.findFirst({
    where: { propertyId: azuraProperty.id, name: 'Presidential Suite' },
  });

  if (!suiteRoomType) {
    suiteRoomType = await prisma.roomType.create({
      data: {
        propertyId: azuraProperty.id,
        name: 'Presidential Suite',
        basePrice: 12000,
        totalUnits: 2,
        maxOccupancy: 4,
        isActive: true,
      },
    });
  }

  // 5. Populate Staff Members for Azura Resorts & Spa
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

  const receptionistUser = await prisma.user.upsert({
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
    where: { propertyId: azuraProperty.id, userId: receptionistUser.id },
  });
  if (!recMember) {
    await prisma.staffMember.create({
      data: {
        propertyId: azuraProperty.id,
        userId: receptionistUser.id,
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

  // 6. Populate TAC Travel Agencies
  let mmtAgency = await prisma.agency.findFirst({
    where: { propertyId: azuraProperty.id, name: 'MakeMyTrip / Goibibo' },
  });
  if (!mmtAgency) {
    mmtAgency = await prisma.agency.create({
      data: {
        propertyId: azuraProperty.id,
        name: 'MakeMyTrip / Goibibo',
        contactPerson: 'Vikram Sethi',
        email: 'partners@go-mmt.com',
        phone: '+91 9811002233',
        defaultTacRate: 10,
        isActive: true,
      },
    });
  }

  let bookingComAgency = await prisma.agency.findFirst({
    where: { propertyId: azuraProperty.id, name: 'Booking.com Partner' },
  });
  if (!bookingComAgency) {
    bookingComAgency = await prisma.agency.create({
      data: {
        propertyId: azuraProperty.id,
        name: 'Booking.com Partner',
        contactPerson: 'Sarah Jenkins',
        email: 'apac-partners@booking.com',
        phone: '+91 9822334455',
        defaultTacRate: 15,
        isActive: true,
      },
    });
  }

  // 7. Ensure Room Units & Bookings
  let room201 = await prisma.roomUnit.findFirst({
    where: { propertyId: azuraProperty.id, unitNumber: '201' },
  });
  if (!room201) {
    room201 = await prisma.roomUnit.create({
      data: {
        propertyId: azuraProperty.id,
        roomTypeId: deluxeRoomType.id,
        unitNumber: '201',
        cleanlinessStatus: CleanlinessStatus.CLEAN,
      },
    });
  }

  let room202 = await prisma.roomUnit.findFirst({
    where: { propertyId: azuraProperty.id, unitNumber: '202' },
  });
  if (!room202) {
    room202 = await prisma.roomUnit.create({
      data: {
        propertyId: azuraProperty.id,
        roomTypeId: deluxeRoomType.id,
        unitNumber: '202',
        cleanlinessStatus: CleanlinessStatus.DIRTY,
      },
    });
  }

  let room301 = await prisma.roomUnit.findFirst({
    where: { propertyId: azuraProperty.id, unitNumber: '301' },
  });
  if (!room301) {
    room301 = await prisma.roomUnit.create({
      data: {
        propertyId: azuraProperty.id,
        roomTypeId: suiteRoomType.id,
        unitNumber: '301',
        cleanlinessStatus: CleanlinessStatus.CLEAN,
      },
    });
  }

  // Cleanup removed guests if they exist in DB
  const namesToRemove = ['Sneha Reddy', 'Priya Nair', 'Ananya Patel'];
  const guestsToRemove = await prisma.guest.findMany({
    where: { fullName: { in: namesToRemove } },
    select: { id: true },
  });

  if (guestsToRemove.length > 0) {
    const ids = guestsToRemove.map((g) => g.id);
    await prisma.booking.deleteMany({ where: { guestId: { in: ids } } });
    await prisma.guest.deleteMany({ where: { id: { in: ids } } });
  }

  // 8. Sample Guests & Bookings (Rahul Sharma, Vikram Malhotra, Arjun Kapoor)
  const sampleGuests = [
    { fullName: 'Rahul Sharma', phone: '+91 9876543210', email: 'rahul.sharma@example.com', nationality: 'Indian' },
    { fullName: 'Vikram Malhotra', phone: '+91 9822114455', email: 'vikram.m@example.com', nationality: 'Indian' },
    { fullName: 'Arjun Kapoor', phone: '+91 9844556677', email: 'arjun.k@example.com', nationality: 'Indian' },
  ];

  const createdGuests = [];
  for (const g of sampleGuests) {
    let guest = await prisma.guest.findFirst({
      where: { propertyId: azuraProperty.id, phone: g.phone },
    });
    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          propertyId: azuraProperty.id,
          fullName: g.fullName,
          phone: g.phone,
          email: g.email,
          nationality: g.nationality,
          totalVisits: 1,
          totalSpend: 16500,
        },
      });
    }
    createdGuests.push(guest);
  }

  const bookingCount = await prisma.booking.count({ where: { propertyId: azuraProperty.id } });
  if (bookingCount === 0) {
    const today = new Date();

    // Booking 1: Rahul Sharma (Checked In)
    const in1 = new Date(today);
    const out1 = new Date(today);
    out1.setDate(out1.getDate() + 3);
    await prisma.booking.create({
      data: {
        propertyId: azuraProperty.id,
        guestId: createdGuests[0].id,
        roomTypeId: deluxeRoomType.id,
        roomUnitId: room201.id,
        checkInDate: in1,
        checkOutDate: out1,
        status: BookingStatus.CHECKED_IN,
        baseAmount: 16500,
        totalAmount: 16500,
        channel: BookingChannel.WEBSITE,
        createdByUserId: azuraUser.id,
      },
    });

    // Booking 2: Vikram Malhotra (Checked In)
    const in3 = new Date(today);
    const out3 = new Date(today);
    out3.setDate(out3.getDate() + 5);
    await prisma.booking.create({
      data: {
        propertyId: azuraProperty.id,
        guestId: createdGuests[1].id,
        roomTypeId: suiteRoomType.id,
        roomUnitId: room301.id,
        checkInDate: in3,
        checkOutDate: out3,
        status: BookingStatus.CHECKED_IN,
        baseAmount: 36000,
        totalAmount: 36000,
        channel: BookingChannel.WALK_IN,
        createdByUserId: azuraUser.id,
      },
    });

    // Booking 3: Arjun Kapoor (Checked Out)
    const in5 = new Date(today);
    in5.setDate(in5.getDate() - 5);
    const out5 = new Date(today);
    out5.setDate(out5.getDate() - 1);
    await prisma.booking.create({
      data: {
        propertyId: azuraProperty.id,
        guestId: createdGuests[2].id,
        roomTypeId: suiteRoomType.id,
        checkInDate: in5,
        checkOutDate: out5,
        status: BookingStatus.CHECKED_OUT,
        baseAmount: 48000,
        totalAmount: 48000,
        channel: BookingChannel.AGENCY,
        createdByUserId: azuraUser.id,
      },
    });
  }

  console.log(`✅ Super Admin created: ${mubashirAdmin.email}`);
  console.log(`✅ Owner created: ${azuraUser.email}`);
  console.log(`✅ Default Invoice Templates & Demo Property populated with Staff, Bookings, Guests & TAC.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
