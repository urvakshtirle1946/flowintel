const { SerialPort, ReadlineParser } = require('serialport');
const { houses } = require('./network');
const { normalizeReading, parseArduinoLine } = require('./telemetry');

const buildMockReading = (house) => {
  const minuteOfDay = new Date().getHours() * 60 + new Date().getMinutes();
  const demandWave = Math.sin((minuteOfDay / 1440) * Math.PI * 2);
  const bias = house.demandBand === 'Critical' ? 4 : house.demandBand === 'High' ? 2.5 : 0;
  const drift = (Math.random() - 0.5) * 2.8;

  let flow_rate = 10 + demandWave * 4 + bias + drift;
  let pressure = 46 + bias * 2 - demandWave * 5 + drift * 3;

  const anomalyChance = Math.random();
  if (anomalyChance > 0.9) {
    flow_rate = 0;
    pressure = 6 + Math.random() * 4;
  } else if (anomalyChance > 0.78) {
    flow_rate = 1.3 + Math.random() * 1.1;
    pressure = 13 + Math.random() * 4;
  } else if (anomalyChance > 0.64) {
    flow_rate = 21 + Math.random() * 4;
    pressure = 68 + Math.random() * 6;
  }

  return normalizeReading({
    house_id: house.id,
    flow_rate,
    pressure,
    is_mock: true,
  });
};

const setupHardware = (onDataReceived) => {
  const portName = process.env.SERIAL_PORT || 'COM7';

  let port;
  let parser;

  try {
    port = new SerialPort({
      path: portName,
      baudRate: 9600,
      autoOpen: false,
    });

    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.open((err) => {
      if (err) {
        console.warn(`Could not open real serial port ${portName}:`, err.message);
      } else {
        console.log(`Successfully connected to Arduino on ${portName}`);
      }
      // Start mock mode for other houses regardless of serial connection
      startMockMode(onDataReceived);
    });

    parser.on('data', (data) => {
      try {
        const reading = parseArduinoLine(data);

        if (reading) {
          onDataReceived(reading);
        }
      } catch (error) {
        console.warn('Failed to parse incoming serial data:', data);
      }
    });
  } catch (err) {
    console.warn('Problem initializing SerialPort:', err.message);
    startMockMode(onDataReceived);
  }
};

const startMockMode = (onDataReceived) => {
  console.log('--- STARTING BACKGROUND SIMULATION FOR DUMMY NODES ---');
  setInterval(() => {
    houses.forEach((house) => {
      // SKIP house_1 so it only updates from real Arduino data
      if (house.id === 'house_1') return;

      const reading = buildMockReading(house);
      onDataReceived(reading);
    });
  }, 4000);
};

module.exports = { setupHardware };

