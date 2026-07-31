import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const staff = await prisma.staffMember.findMany({
    include: {
      user: { select: { email: true, role: true } },
      property: { select: { id: true, name: true } },
    },
  });

  console.log('All Staff Members in DB:');
  console.dir(staff, { depth: null });
}

main();
