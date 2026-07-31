import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AnalyticsService } from './modules/analytics/analytics.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const analyticsService = app.get(AnalyticsService);

  const userId = 'e0493c36-6e87-4ffa-bb6e-23aaec6d7fc6'; // mubashir@azura.com
  
  try {
    console.log("Testing with 'undefined' string...");
    const res = await analyticsService.getDashboardAnalytics(userId, 'undefined');
    console.log('Result:', res);
  } catch (err) {
    console.error('Analytics ERROR:', err);
  }

  await app.close();
}

main();
