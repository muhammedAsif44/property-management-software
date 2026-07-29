import { PrismaClient, UserRole, ApprovalStatus } from '@prisma/client';
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

  console.log(`✅ Super Admin created: ${superAdmin.email}`);
  console.log(`✅ Default Invoice Templates created.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
