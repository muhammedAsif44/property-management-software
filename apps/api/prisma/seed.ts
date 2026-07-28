import { PrismaClient, UserRole, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Super Admin user...');

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

  // 2. Create Super Admin User
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
    },
    create: {
      organizationId: systemOrg.id,
      email: superAdminEmail,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
    },
  });

  console.log(`✅ Super Admin created: ${superAdmin.email} (Password: Admin@123456)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
