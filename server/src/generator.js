function gaussian() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sensorValue(mean, deviation, spikeSize, decimals = 1) {
  const spike = Math.random() < 0.05 ? (Math.random() > 0.5 ? spikeSize : -spikeSize) : 0;
  return Number((mean + gaussian() * deviation + spike).toFixed(decimals));
}

export function generateReading() {
  return {
    temperature: sensorValue(24, 2.5, 14),
    humidity: sensorValue(55, 6, 28),
    pressure: sensorValue(1013, 9, 55),
    timestamp: new Date(),
  };
}
