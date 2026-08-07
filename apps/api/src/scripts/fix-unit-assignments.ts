import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Re-assigning Sophia Martinez & Family to physical Unit 102 (ID: 74b612fb-f08c-4938-b575-0e6fb505568b)...');

  const unit102 = await prisma.roomUnit.findFirst({
    where: { unitNumber: '102' },
  });

  if (!unit102) {
    console.error('Unit 102 not found.');
    return;
  }

  // Update Sophia Martinez & Family booking to Unit 102
  const updated = await prisma.booking.update({
    where: { id: '3a403851-aa0b-4e67-b7cd-a4cac98f725c' },
    data: {
      roomUnitId: unit102.id,
    },
  });

  console.log(`✅ Successfully re-assigned booking ${updated.id} to Unit 102 (${unit102.unitNumber})!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
