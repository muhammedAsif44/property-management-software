import { FinancialDecimal, calculateTac } from './financial-math';

/**
 * Enterprise Production Verification Suite: TAC Booking Calculations
 */
export function runBookingTacTests() {
  // 1. Standard 10% TAC calculation on ₹10,000 stay
  const res1 = calculateTac(10000, 10);
  console.assert(res1.tacAmount === 1000, 'Test 1 Failed: TAC Amount');
  console.assert(res1.propertyAmount === 9000, 'Test 1 Failed: Property Amount');

  // 2. 0% TAC calculation (Direct booking equivalent)
  const res2 = calculateTac(5000, 0);
  console.assert(res2.tacAmount === 0, 'Test 2 Failed: TAC Amount');
  console.assert(res2.propertyAmount === 5000, 'Test 2 Failed: Property Amount');

  // 3. 100% TAC boundary calculation
  const res3 = calculateTac(5000, 100);
  console.assert(res3.tacAmount === 5000, 'Test 3 Failed: TAC Amount');
  console.assert(res3.propertyAmount === 0, 'Test 3 Failed: Property Amount');

  // 4. ₹0 stay total edge case
  const res4 = calculateTac(0, 15);
  console.assert(res4.tacAmount === 0, 'Test 4 Failed: TAC Amount');
  console.assert(res4.propertyAmount === 0, 'Test 4 Failed: Property Amount');

  // 5. Fractional rate (12.5%) on ₹8,450 booking
  const res5 = calculateTac(8450, 12.5);
  console.assert(res5.tacAmount === 1056.25, 'Test 5 Failed: TAC Amount');
  console.assert(res5.propertyAmount === 7393.75, 'Test 5 Failed: Property Amount');

  // 6. Snapshot Rate Preservation Test
  const frozenSnapshotRate = 10;
  const grossStayAmount = 10000;
  const snapshotRes = calculateTac(grossStayAmount, frozenSnapshotRate);
  console.assert(snapshotRes.tacAmount === 1000, 'Test 6 Failed: Snapshot Rate Preservation');

  // 7. Booking Edit Recalculation Test (Stay Extension)
  const extendedGrossAmount = 15000;
  const recalculatedRes = calculateTac(extendedGrossAmount, frozenSnapshotRate);
  console.assert(recalculatedRes.tacAmount === 1500, 'Test 7 Failed: Booking Edit Recalculation');

  // 8. FinancialDecimal Scaled BigInt Precision Addition & Subtraction
  const a = new FinancialDecimal('150.50');
  const b = new FinancialDecimal('49.50');
  console.assert(a.plus(b).toNumber() === 200, 'Test 8 Failed: BigInt Scaled Addition');
  console.assert(a.minus(b).toNumber() === 101, 'Test 8 Failed: BigInt Scaled Subtraction');
}
