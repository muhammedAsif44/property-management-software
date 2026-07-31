import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const azuraUser = await prisma.user.findFirst({
    where: { email: 'mubashir@azura.com' },
    include: { organization: true, owner: true },
  });

  console.log('Azura User:', azuraUser?.email, 'Org ID:', azuraUser?.organizationId);

  const orgProperties = await prisma.property.findMany({
    where: { organizationId: azuraUser?.organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      createdAt: true,
      deletedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('Total Properties under Azura Org:', orgProperties.length);
  console.dir(orgProperties, { depth: null });
}

main();
