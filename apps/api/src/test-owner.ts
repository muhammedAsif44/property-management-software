import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'mbashir@azura.com' }, // or whatever email they used
  });
  if (!user) {
    const anyUser = await prisma.user.findFirst({
        where: { role: 'OWNER' },
        include: { owner: true }
    });
    console.log("No specific user, using:", anyUser);
  } else {
    console.log("User:", user);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
