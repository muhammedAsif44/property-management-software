import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mubashirUser = await prisma.user.findUnique({
    where: { email: 'mubashir@azura.com' },
    include: { owner: true },
  });

  if (!mubashirUser || !mubashirUser.owner) {
    console.log('Mubashir owner not found');
    return;
  }

  // 1. Rename existing property back to "Azura Resorts & Spa"
  const existingProp = await prisma.property.findFirst({
    where: { ownerId: mubashirUser.owner.id },
  });

  if (existingProp) {
    await prisma.property.update({
      where: { id: existingProp.id },
      data: {
        name: 'Azura Resorts & Spa',
        city: 'Goa',
        state: 'Goa',
        address: 'Beach Road, Calangute',
        onboardingStep: 6,
        status: 'ACTIVE',
      },
    });
    console.log('Restored existing property to "Azura Resorts & Spa"');
  }

  // 2. Create second property "Branch 2 - Hillside Resort" for Mubashir
  const newBranch = await prisma.property.create({
    data: {
      name: 'Branch 2 - Hillside Resort',
      slug: 'branch-2-hillside-resort-' + Date.now(),
      organizationId: mubashirUser.organizationId!,
      ownerId: mubashirUser.owner.id,
      address: 'Hilltop Avenue',
      city: 'Wayanad',
      state: 'Kerala',
      country: 'IN',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      onboardingStep: 6,
      status: 'ACTIVE',
      settings: {
        create: {
          checkInTime: '14:00',
          checkOutTime: '11:00',
        },
      },
    },
  });

  console.log('Created second property:', newBranch.name, newBranch.id);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
