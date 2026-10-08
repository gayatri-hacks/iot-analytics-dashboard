const SENSOR_FIELDS = ['temperature', 'humidity', 'pressure'];
const Z_SCORE_THRESHOLD = 3.5;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function standardDeviation(values, average) {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function summarize(values) {
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    avg: Number(avg.toFixed(2)),
    min: Math.min(...values),
    max: Math.max(...values),
    std: Number(standardDeviation(values, avg).toFixed(2)),
  };
}

function anomalyIndexes(readings, field) {
  const values = readings.map((reading) => reading[field]);
  const center = median(values);
  const mad = median(values.map((value) => Math.abs(value - center)));

  // With one repeated baseline and a different value, the zero MAD itself is the signal.
  if (mad === 0) return new Set(values.map((value, index) => (value !== center ? index : null)).filter((index) => index !== null));
  return new Set(
    values
      .map((value, index) => ({ index, score: (0.6745 * Math.abs(value - center)) / mad }))
      .filter(({ score }) => score > Z_SCORE_THRESHOLD)
      .map(({ index }) => index),
  );
}

export function analyzeReadings(readings) {
  if (readings.length === 0) {
    return { totalReadings: 0, stats: {}, alerts: [], anomalyIndexes: [] };
  }

  const stats = Object.fromEntries(
    SENSOR_FIELDS.map((field) => [field, summarize(readings.map((reading) => reading[field]))]),
  );
  const flagged = new Set();
  const alerts = [];

  SENSOR_FIELDS.forEach((field) => {
    anomalyIndexes(readings, field).forEach((index) => {
      flagged.add(index);
      alerts.push({
        readingIndex: index,
        field,
        message: `${field[0].toUpperCase()}${field.slice(1)} anomaly detected at reading ${index + 1}`,
      });
    });
  });

  return {
    totalReadings: readings.length,
    stats,
    alerts,
    anomalyIndexes: [...flagged].sort((a, b) => a - b),
  };
}

export { SENSOR_FIELDS };
