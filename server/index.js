const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initDb, storeReading, getLatestReadings, getReadingHistory, getHouseStats } = require('./db');
const { setupHardware } = require('./hardware');
const { getNetworkSnapshot, houses, zones } = require('./network');

let openai;
try {
  require('dotenv').config();
  const { OpenAI } = require('openai');
  openai = new OpenAI();
  console.log('OpenAI SDK initialized successfully.');
} catch (e) {
  console.warn('OpenAI SDK not installed. Please run: npm install openai dotenv');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDb();

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  getLatestReadings((readings) => {
    socket.emit('initialReadings', readings);
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected:', socket.id);
  });
});

const handleSensorData = (reading) => {
  console.log('Received sensor data:', reading);
  storeReading(reading);
  io.emit('sensorUpdate', reading);
};

setupHardware(handleSensorData);

app.get('/api/status', (req, res) => {
  res.json({
    status: 'Online',
    message: 'Flow monitoring backend is streaming telemetry.',
    houses: houses.length,
    zones: zones.length,
    generatedAt: new Date().toISOString(),
  });
});

app.get('/api/network', (req, res) => {
  res.json(getNetworkSnapshot());
});

app.get('/api/zones', (req, res) => {
  res.json(
    zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      areaLabel: zone.areaLabel,
      description: zone.description,
      tank: zone.tank,
      houseCount: zone.houses.length,
    })),
  );
});

app.get('/api/readings/latest', (req, res) => {
  getLatestReadings((readings) => {
    res.json(readings);
  });
});

app.get('/api/readings/history', (req, res) => {
  const houseId = String(req.query.houseId || '').trim();
  const limit = Number(req.query.limit || 24);

  if (!houseId) {
    res.status(400).json({ error: 'houseId query parameter is required.' });
    return;
  }

  getReadingHistory({ houseId, limit }, (rows) => {
    res.json(rows);
  });
});

app.get('/api/stats', (req, res) => {
  getHouseStats((stats) => {
    res.json(stats);
  });
});

app.post('/api/ai-suggestions', async (req, res) => {
  if (!openai) {
    return res.status(500).json({ error: 'OpenAI SDK not initialized' });
  }

  const { physicalNode, totalDemand, anomalyCount, networkZones } = req.body;

  try {
    const prompt = `You are an AI Smart City Water Infrastructure Analyst.
The current live telemetry from the main physical hardware sensor (House 1) is:
- Flow Rate: ${physicalNode?.flow_rate || 0} L/min
- Pressure: ${physicalNode?.pressure || 0} kPa
- Status: ${physicalNode?.status || 'Offline'}

Global Network Stats:
- Total Demand: ${totalDemand || 0} L/min
- Active Anomalies: ${anomalyCount || 0}

Generate exactly 2 highly actionable, technical infrastructure insights based ONLY on this current real-time data.
Return ONLY a valid JSON object with a single key "suggestions" containing an array of 2 objects.
Each object must have:
"title" (string, short 3-5 word summary)
"description" (string, 2-3 sentence technical business/engineering recommendation)
"icon" (string, must be precisely one of: "BrainCircuit", "AlertTriangle", "Droplet")

If the physical flow matches 0.00 L/min, immediately suggest dispatching a field technician to inspect the primary valve or pump. If flow is high/normal, suggest pressure optimization or routing.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    res.json(parsed.suggestions);
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

app.post('/api/ai-forecasting', async (req, res) => {
  if (!openai) return res.status(500).json({ error: 'OpenAI not initialized' });
  const { stats, totalDemand } = req.body;
  try {
    const prompt = `You are a predictive maintenance AI.
Accumulated flow stats: ${JSON.stringify(stats)}
Current Network Demand: ${totalDemand} L/min

Return a JSON object with:
"forecast_demand_lpm": (number, predicted peak demand considering network topology, make it realistic)
"maintenance_suggestions": array of objects with { "house_id", "reason", "urgency" (High, Medium, Low) }
Focus on stations with highest cumulative flow or fault count for predictions.`;
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });
    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) { res.status(500).json({ error: 'Failed to forecast' }); }
});

app.post('/api/ai-footprint', async (req, res) => {
  if (!openai) return res.status(500).json({ error: 'OpenAI not initialized' });
  const { physicalLiters, netflixHours, socialMediaHours, aiQueries } = req.body;
  try {
    const prompt = `You are a Digital Water Footprint Calculator.
User's data: Physical water: ${physicalLiters} L. Netflix: ${netflixHours} hrs. Social: ${socialMediaHours} hrs. AI Prompts: ${aiQueries}

Calculate the estimated digital water used to cool data centers: approx 5L per hr of streaming, 1L per social hr, 0.2L per AI query.
Return JSON object:
"digital_liters_total": (number)
"breakdown_text": (short explanation)
"conservation_tip": (1 actionable tip comparing physical to digital, engaging)`;
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });
    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/aquabot', async (req, res) => {
  if (!openai) return res.status(500).json({ error: 'OpenAI not initialized' });
  const { message, context } = req.body;
  try {
    const prompt = `You are AquaBot, an AI assistant for the Smart Indore water observatory.
Context: ${JSON.stringify(context)}
User says: "${message}"
Reply warmly, concisely, in French (as the dashboard is in French). Max 3 sentences.`;
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "gpt-4o-mini",
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
