import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function m() {
  const user = await prisma.user.findFirst({
    where: { email: 'mubashir@azura.com' },
    include: { owner: true }
  });
  console.log('User:', user);
  
  if (user) {
    const props = await prisma.property.findMany({
      where: {
        OR: [
          { ownerId: user.owner?.id },
          { organizationId: user.organizationId }
        ]
      }
    });
    console.log('Properties:', props);
  }
}
m().catch(console.error).finally(() => prisma.$disconnect());
