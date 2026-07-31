import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminService } from './modules/admin/admin.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  try {
    const res = await adminService.getPendingOwners();
    console.log('getPendingOwners SUCCESS:', res);
  } catch (err) {
    console.error('getPendingOwners ERROR:', err);
  }

  await app.close();
}

main();
