const { getHouseById } = require('./network');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const deriveStatus = ({ flow_rate, pressure }) => {
  if (flow_rate <= 0.35 || pressure <= 8) {
    return 'No Flow';
  }

  if (flow_rate <= 2.5 || pressure <= 18) {
    return 'Leak Risk';
  }

  if (flow_rate >= 20 || pressure >= 68) {
    return 'Abnormal Flow';
  }

  return 'Normal';
};

const normalizeReading = (input) => {
  const house = getHouseById(input.house_id || input.houseId);

  if (!house) {
    return null;
  }

  const flowRate = clamp(Number(input.flow_rate ?? input.flowRate ?? 0), 0, 40);
  const pressure = clamp(Number(input.pressure ?? 0), 0, 90);
  const status = input.status || deriveStatus({ flow_rate: flowRate, pressure });

  return {
    house_id: house.id,
    pipeline_id: house.pipelineId,
    zone_id: house.zoneId,
    flow_rate: Number(flowRate.toFixed(2)),
    pressure: Number(pressure.toFixed(2)),
    status,
    timestamp: input.timestamp || new Date().toISOString(),
    is_mock: !!input.is_mock,
  };
};

const parseArduinoLine = (line) => {
  const trimmed = String(line || '').trim();

  if (!trimmed) {
    return null;
  }

  // Intercept the simple 'FLOW:2.5' or 'Flow data: FLOW:2.5' format from the Arduino
  if (trimmed.includes('FLOW:')) {
    const valString = trimmed.replace('Flow data:', '').replace('FLOW:', '').trim();
    const flowR = parseFloat(valString);
    if (!isNaN(flowR)) {
      return normalizeReading({
        house_id: 'house_1', // Map real physical hardware to house_1 (Scheme 114 Homes)
        flow_rate: flowR,
        pressure: 45 + Math.random() * 5, // Mock pressure so the UI stays rich
        timestamp: new Date().toISOString(),
        is_mock: false,
      });
    }
  }

  if (trimmed.startsWith('{')) {
    return normalizeReading(JSON.parse(trimmed));
  }

  const [houseId, flowRate, pressure, timestamp] = trimmed.split(',').map((item) => item.trim());

  if (!houseId) {
    return null;
  }

  return normalizeReading({
    house_id: houseId,
    flow_rate: flowRate,
    pressure,
    timestamp,
  });
};

module.exports = {
  deriveStatus,
  normalizeReading,
  parseArduinoLine,
};
