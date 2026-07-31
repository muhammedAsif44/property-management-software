import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const azuraUser = await prisma.user.findFirst({
    where: { email: 'mubashir@azura.com' },
  });

  if (!azuraUser) return;

  // Soft delete test properties named 'New Property Branch'
  const deleted = await prisma.property.deleteMany({
    where: {
      organizationId: azuraUser.organizationId,
      name: 'New Property Branch',
    },
  });

  console.log(`Cleaned up ${deleted.count} test properties.`);

  const remainingProps = await prisma.property.findMany({
    where: {
      organizationId: azuraUser.organizationId,
      deletedAt: null,
    },
    select: { id: true, name: true, createdAt: true },
  });

  console.log('Remaining authentic properties for Azura:', remainingProps);
}

main();
