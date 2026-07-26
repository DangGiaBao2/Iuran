import { describe, expect, it } from 'vitest';

// Inline utility (mirrors what UI components do)
function formatUsdc(amountStr: string): string {
  const num = Number(amountStr) / 1_000_000;
  return `${num.toFixed(2)} USDC`;
}

describe('formatUsdc', () => {
  it('formats 20 USDC correctly', () => {
    expect(formatUsdc('20000000')).toBe('20.00 USDC');
  });

  it('formats 0 correctly', () => {
    expect(formatUsdc('0')).toBe('0.00 USDC');
  });

  it('formats fractional USDC', () => {
    expect(formatUsdc('1500000')).toBe('1.50 USDC');
  });

  it('formats large amount', () => {
    expect(formatUsdc('100000000')).toBe('100.00 USDC');
  });
});
