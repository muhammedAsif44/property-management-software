/**
 * Financial Decimal Math Utility for Orvyn PMS
 * Guarantees exact 2-decimal place currency calculations without floating-point drift using scaled BigInt precision.
 */

export class FinancialDecimal {
  private cents: bigint;

  constructor(amount: number | string | bigint) {
    if (typeof amount === 'bigint') {
      this.cents = amount;
    } else {
      const parsed = parseFloat(String(amount || 0));
      this.cents = BigInt(Math.round(parsed * 100));
    }
  }

  public mulPercent(percent: number | string): FinancialDecimal {
    const p = parseFloat(String(percent || 0));
    const percentScaled = BigInt(Math.round(p * 10000));
    const resultCents = (this.cents * percentScaled + BigInt(500000)) / BigInt(1000000);
    return new FinancialDecimal(resultCents);
  }

  public minus(other: FinancialDecimal): FinancialDecimal {
    return new FinancialDecimal(this.cents - other.cents);
  }

  public plus(other: FinancialDecimal): FinancialDecimal {
    return new FinancialDecimal(this.cents + other.cents);
  }

  public toNumber(): number {
    return Number(this.cents) / 100;
  }

  public toFixed(decimals = 2): string {
    return (Number(this.cents) / 100).toFixed(decimals);
  }

  public formatINR(): string {
    return (Number(this.cents) / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}

export function calculateTac(grossAmount: number | string, tacRate: number | string) {
  const gross = new FinancialDecimal(grossAmount);
  const tacAmount = gross.mulPercent(tacRate);
  const propertyAmount = gross.minus(tacAmount);

  return {
    tacAmount: tacAmount.toNumber(),
    propertyAmount: propertyAmount.toNumber(),
    tacAmountFormatted: tacAmount.formatINR(),
    propertyAmountFormatted: propertyAmount.formatINR(),
  };
}
