import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PropertiesService } from './modules/properties/properties.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const propertiesService = app.get(PropertiesService);

  const userId = 'e0493c36-6e87-4ffa-bb6e-23aaec6d7fc6'; // mubashir@azura.com
  const propertyId = 'c6c1e082-7c19-4922-9639-c11391dd621e'; // Branch 2
  
  try {
    const res = await propertiesService.switchActiveProperty(userId, propertyId);
    console.log('Success:', res);
  } catch (err) {
    console.error('Error switching property:', err);
  }

  await app.close();
}

main();
