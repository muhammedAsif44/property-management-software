import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PropertiesService } from './modules/properties/properties.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const propertiesService = app.get(PropertiesService);

  const userId = 'c1ade0d3-e351-4900-8acf-1692e74ce1d3'; // asif.techon@gmail.com
  
  try {
    const res = await propertiesService.createProperty(userId, {
      name: 'Test Azura',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      country: 'IN',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    });
    console.log('Success:', res);
  } catch (err) {
    console.error('Error creating property:', err);
  }

  await app.close();
}

main();
