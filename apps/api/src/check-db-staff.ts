import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== USERS ===');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true,
      owner: { select: { id: true, fullName: true, defaultPropertyId: true } },
      staffMemberships: {
        select: {
          id: true,
          propertyId: true,
          role: true,
          status: true,
        },
      },
    },
  });
  console.log(JSON.stringify(users, null, 2));

  console.log('=== PROPERTIES ===');
  const props = await prisma.property.findMany({
    select: {
      id: true,
      name: true,
      ownerId: true,
      organizationId: true,
      owner: {
        select: {
          id: true,
          fullName: true,
          user: { select: { email: true } },
        },
      },
      staffMembers: {
        select: {
          id: true,
          role: true,
          status: true,
          user: { select: { email: true } },
        },
      },
    },
  });
  console.log(JSON.stringify(props, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
