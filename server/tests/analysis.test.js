import { describe, expect, it } from 'vitest';
import { analyzeReadings } from '../src/analysis.js';

const reading = (temperature, humidity = 50, pressure = 1010) => ({ temperature, humidity, pressure });

describe('analyzeReadings', () => {
  it('summarizes normal data without alerts', () => {
    const result = analyzeReadings([1, 2, 3, 4, 5].map((value) => reading(value)));
    expect(result.stats.temperature.avg).toBe(3);
    expect(result.alerts).toHaveLength(0);
  });

  it('flags an obvious spike', () => {
    const result = analyzeReadings([10, 10, 10, 10, 100].map((value) => reading(value)));
    expect(result.anomalyIndexes).toEqual([4]);
    expect(result.alerts[0].field).toBe('temperature');
  });

  it('does not flag all-identical values', () => {
    const result = analyzeReadings([reading(10), reading(10), reading(10)]);
    expect(result.anomalyIndexes).toEqual([]);
    expect(result.stats.temperature.std).toBe(0);
  });

  it('handles a single reading', () => {
    const result = analyzeReadings([reading(22, 45, 1008)]);
    expect(result.totalReadings).toBe(1);
    expect(result.stats.pressure).toEqual({ avg: 1008, min: 1008, max: 1008, std: 0 });
  });
});
