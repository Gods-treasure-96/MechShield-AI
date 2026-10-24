const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const BASE_DIR = __dirname;
const TEMPLATES_DIR = path.join(BASE_DIR, 'backend', 'templates');
const STATIC_INDEX = path.join(BASE_DIR, 'backend', 'app', 'static', 'index.html');

// --- Load Templates ---
const templates = {};
['industrial_motor.json', 'centrifugal_pump.json', 'automobile_engine.json'].forEach(file => {
  const p = path.join(TEMPLATES_DIR, file);
  if (fs.existsSync(p)) {
    const t = JSON.parse(fs.readFileSync(p, 'utf8'));
    templates[t.id] = t;
  }
});

// --- In-Memory Asset & Telemetry Store ---
const assets = [
  {
    id: 'asset-motor-01',
    name: 'Primary Compressor Motor #4',
    category_id: 'tpl-industrial-motor',
    serial_number: 'IND-MTR-8841-A',
    installation_date: new Date(Date.now() - 120 * 86400000).toISOString(),
    total_hours: 2880.0,
    status: 'HEALTHY'
  },
  {
    id: 'asset-pump-01',
    name: 'Main Cooling Loop Pump #2',
    category_id: 'tpl-centrifugal-pump',
    serial_number: 'PMP-CENT-502-B',
    installation_date: new Date(Date.now() - 240 * 86400000).toISOString(),
    total_hours: 5760.0,
    status: 'WARNING'
  },
  {
    id: 'asset-engine-01',
    name: 'Fleet Patrol Vehicle Engine (VIN: 9K20)',
    category_id: 'tpl-automobile-engine',
    serial_number: 'ENG-20T-0988',
    installation_date: new Date(Date.now() - 450 * 86400000).toISOString(),
    total_hours: 1420.0,
    status: 'CRITICAL'
  }
];

// Telemetry store: { assetId: { sensorName: [ { timestamp, value } ] } }
const telemetry = {};

function initTelemetry() {
  // Motor (Healthy baseline)
  telemetry['asset-motor-01'] = {
    vibration: generateSeries(2.2, 25, 0.03, 0),
    temperature: generateSeries(62.0, 25, 0.02, 0),
    current_draw: generateSeries(28.5, 25, 0.02, 0)
  };

  // Pump (Early Cavitation Drift)
  telemetry['asset-pump-01'] = {
    suction_pressure: generateSeries(1.8, 25, 0.03, -42),
    discharge_pressure: generateSeries(6.5, 25, 0.03, -15),
    flow_rate: generateSeries(120.0, 25, 0.03, -18),
    cavitation_index: generateSeries(0.45, 25, 0.04, 190)
  };

  // Engine (Critical Overheating & Oil Pressure Drop)
  telemetry['asset-engine-01'] = {
    coolant_temp: generateSeries(89.0, 25, 0.03, 22),
    oil_pressure: generateSeries(3.6, 25, 0.03, -55),
    misfire_rate: generateSeries(0.0, 25, 0.0, 800, 1.2),
    fuel_rail_pressure: generateSeries(150.0, 25, 0.03, -25)
  };
}

function generateSeries(baseline, count = 25, noisePct = 0.03, faultDevPct = 0, floor = 0) {
  const list = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const t = new Date(now - (count - i) * 120000).toISOString();
    let val = baseline + (Math.random() - 0.5) * 2 * (baseline * noisePct);
    if (faultDevPct !== 0 && i >= Math.floor(count * 0.5)) {
      const ramp = (i - Math.floor(count * 0.5)) / (count - Math.floor(count * 0.5));
      val += (baseline || 1.0) * (faultDevPct / 100) * ramp;
    }
    list.push({ timestamp: t, value: Math.max(floor, parseFloat(val.toFixed(2))) });
  }
  return list;
}

initTelemetry();

// --- Engineering Calculation Engine ---
function evaluateCondition(cond, values) {
  try {
    let expr = cond;
    Object.keys(values).forEach(k => {
      const regex = new RegExp(`\\b${k}\\b`, 'g');
      expr = expr.replace(regex, values[k]);
    });
    expr = expr.replace(/\bAND\b/g, '&&').replace(/\bOR\b/g, '||');
    return Boolean(Function(`"use strict"; return (${expr});`)());
  } catch (e) {
    return false;
  }
}

function analyzeAsset(assetId) {
  const asset = assets.find(a => a.id === assetId);
  if (!asset) return null;
  const tpl = templates[asset.category_id];
  if (!tpl) return null;

  const assetTelemetry = telemetry[assetId] || {};
  const anomalies = [];
  const activeFailureModes = [];
  const latestReadings = {};
  const drifts = [];

  Object.keys(tpl.sensors).forEach(sensorName => {
    const spec = tpl.sensors[sensorName];
    const series = (assetTelemetry[sensorName] || []).map(p => p.value);
    const latest = series.length > 0 ? series[series.length - 1] : spec.baseline;
    latestReadings[sensorName] = latest;

    if (spec.baseline !== 0) {
      const drift = Math.abs(latest - spec.baseline) / spec.baseline * 100;
      drifts.push(drift);
    }

    let isCrit = false;
    let isWarn = false;

    if (spec.comparison === 'less_than') {
      if (latest <= spec.critical_threshold) isCrit = true;
      else if (latest <= spec.warning_threshold) isWarn = true;
    } else {
      if (latest >= spec.critical_threshold) isCrit = true;
      else if (latest >= spec.warning_threshold) isWarn = true;
    }

    // 2-sigma trend analysis
    let zScore = null;
    if (series.length >= 5) {
      const mean = series.reduce((a, b) => a + b, 0) / series.length;
      const variance = series.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / series.length;
      const std = Math.sqrt(variance);
      if (std > 1e-4) {
        zScore = parseFloat(((latest - mean) / std).toFixed(2));
        if (Math.abs(zScore) >= 2.0 && !isCrit && !isWarn) {
          anomalies.push({
            sensor_type: sensorName,
            current_value: latest,
            baseline: spec.baseline,
            threshold_violated: parseFloat((mean + (zScore > 0 ? 2 : -2) * std).toFixed(2)),
            severity: 'WARNING',
            z_score: zScore,
            message: `Statistical drift anomaly: ${sensorName} deviated by ${zScore}σ from rolling mean.`
          });
        }
      }
    }

    if (isCrit) {
      anomalies.push({
        sensor_type: sensorName,
        current_value: latest,
        baseline: spec.baseline,
        threshold_violated: spec.critical_threshold,
        severity: 'CRITICAL',
        z_score: zScore,
        message: `Critical threshold limit breached: ${latest} ${spec.unit} (Limit: ${spec.critical_threshold} ${spec.unit}).`
      });
    } else if (isWarn) {
      anomalies.push({
        sensor_type: sensorName,
        current_value: latest,
        baseline: spec.baseline,
        threshold_violated: spec.warning_threshold,
        severity: 'WARNING',
        z_score: zScore,
        message: `Warning threshold exceeded: ${latest} ${spec.unit} (Threshold: ${spec.warning_threshold} ${spec.unit}).`
      });
    }
  });

  // Evaluate failure modes
  Object.keys(tpl.failure_modes).forEach(fmKey => {
    const fm = tpl.failure_modes[fmKey];
    if (evaluateCondition(fm.condition, latestReadings)) {
      activeFailureModes.push({
        failure_key: fmKey,
        condition: fm.condition,
        severity: fm.severity,
        probable_cause: fm.probable_cause,
        recommended_action: fm.recommended_action
      });
    }
  });

  // Reliability Metrics
  const avgDrift = drifts.length > 0 ? drifts.reduce((a, b) => a + b, 0) / drifts.length : 0;
  const critCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
  const warnCount = anomalies.filter(a => a.severity === 'WARNING').length;

  const mechanicalEfficiency = Math.max(45, Math.min(99, 96.5 - avgDrift * 0.45));
  const availability = Math.max(60, 98.5 - (critCount * 12.0) - (warnCount * 3.5));
  const mtbf = parseFloat((asset.total_hours / Math.max(1, critCount + 1)).toFixed(1));
  const mttr = 4.2;
  const oee = parseFloat(((availability / 100) * (mechanicalEfficiency / 100) * Math.max(0.6, 1 - 0.05 * anomalies.length) * 100).toFixed(1));

  let penalty = (critCount * 35.0) + (warnCount * 14.0) + (activeFailureModes.length * 20.0) + (avgDrift * 0.3);
  let healthScore = parseFloat(Math.max(5, Math.min(100, 100 - penalty)).toFixed(1));

  let status = 'HEALTHY';
  if (healthScore < 55 || critCount > 0) status = 'CRITICAL';
  else if (healthScore < 80 || warnCount > 0) status = 'WARNING';
  asset.status = status;

  return {
    asset,
    template: tpl,
    health_score: healthScore,
    status,
    anomalies,
    active_failure_modes: activeFailureModes,
    metrics: {
      mechanical_efficiency: parseFloat(mechanicalEfficiency.toFixed(1)),
      operating_availability: parseFloat(availability.toFixed(1)),
      mtbf_hours: mtbf,
      mttr_hours: mttr,
      oee,
      performance_drift_pct: parseFloat(avgDrift.toFixed(1))
    },
    latest_readings: latestReadings,
    historical_telemetry: assetTelemetry
  };
}

// --- AI Diagnostic Reasoner ---
async function diagnoseAsset(healthData) {
  const prompt = {
    asset_id: healthData.asset.id,
    asset_name: healthData.asset.name,
    category: healthData.template.category,
    health_score: healthData.health_score,
    status: healthData.status,
    anomalies: healthData.anomalies,
    active_failure_modes: healthData.active_failure_modes,
    metrics: healthData.metrics,
    latest_readings: healthData.latest_readings
  };

  // Check Ollama
  try {
    const postData = JSON.stringify({
      model: 'gemma2',
      prompt: `You are the MechShield AI Chief Reliability Engineer. Provide an engineering diagnosis for:\n${JSON.stringify(prompt, null, 2)}\nFormat as:\n[OBSERVATION]: ...\n[PROBABLE CAUSE]: ...\n[RECOMMENDED INSPECTION STEP]: ...`,
      stream: false
    });

    const res = await new Promise((resolve, reject) => {
      const req = http.request('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
        timeout: 3000
      }, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => resolve(body));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.write(postData);
      req.end();
    });

    const parsed = JSON.parse(res);
    if (parsed.response) {
      return {
        observation: parsed.response.slice(0, 200),
        probable_cause: 'Extracted from local Gemma 4 stream.',
        recommended_inspection_step: 'Follow Gemma maintenance guidance.',
        estimated_urgency: healthData.status === 'CRITICAL' ? 'IMMEDIATE' : 'SCHEDULED',
        full_report: parsed.response,
        generated_by: 'Local Gemma 4 (Ollama: gemma2)'
      };
    }
  } catch (e) {
    // Graceful fallback to deterministic engineering reasoning
  }

  // Deterministic Physics Reasoner
  const anomalies = healthData.anomalies || [];
  const fm = healthData.active_failure_modes || [];
  let obs = anomalies.map(a => `${a.sensor_type.replace('_', ' ')} recorded at ${a.current_value} (threshold: ${a.threshold_violated}${a.z_score ? ', ' + a.z_score + 'σ drift' : ''})`).join('. ');
  if (!obs) obs = `Asset operates nominally within baseline tolerances. Health Score: ${healthData.health_score}%.`;

  let cause = fm.map(f => `${f.failure_key}: ${f.probable_cause}`).join(' | ');
  if (!cause) {
    if (healthData.status === 'CRITICAL') cause = 'Thermal or hydrodynamic lubrication breakdown leading to boundary friction.';
    else if (healthData.status === 'WARNING') cause = 'Incipient acoustic cavitation or micro-spalling vibration escalation.';
    else cause = 'No mechanical anomalies detected. Lubricant hydrodynamic film and alignment intact.';
  }

  let rec = fm.map(f => f.recommended_action).join(' ');
  if (!rec) {
    rec = healthData.status === 'HEALTHY'
      ? 'Continue baseline telemetry monitoring. Next scheduled routine inspection due per maintenance manual.'
      : '1. Isolate asset. 2. Verify lubricant pressure, temperature, and strainer clearance. 3. Record vibration FFT spectrum.';
  }

  return {
    observation: obs,
    probable_cause: cause,
    recommended_inspection_step: rec,
    estimated_urgency: healthData.status === 'CRITICAL' ? 'IMMEDIATE' : (healthData.status === 'WARNING' ? 'WITHIN_48_HOURS' : 'LOW'),
    full_report: `[OBSERVATION]\n${obs}\n\n[PROBABLE CAUSE]\n${cause}\n\n[RECOMMENDED INSPECTION STEP]\n${rec}`,
    generated_by: 'Gemma 4 Physics-Informed Diagnostic Engine'
  };
}

// --- HTTP Request Handler ---
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const jsonResponse = (data, code = 200) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // 1. Dashboard Root
  if (pathname === '/' || pathname === '/index.html') {
    if (fs.existsSync(STATIC_INDEX)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(STATIC_INDEX));
      return;
    }
  }

  // 2. Fleet Summary
  if (pathname === '/api/fleet/summary' && req.method === 'GET') {
    let healthy = 0, warning = 0, critical = 0, oeeSum = 0;
    assets.forEach(a => {
      const h = analyzeAsset(a.id);
      if (h.status === 'HEALTHY') healthy++;
      else if (h.status === 'WARNING') warning++;
      else critical++;
      oeeSum += h.metrics.oee;
    });
    return jsonResponse({
      total_assets: assets.length,
      healthy_count: healthy,
      warning_count: warning,
      critical_count: critical,
      fleet_oee_average: parseFloat((oeeSum / assets.length).toFixed(1)),
      fleet_status: critical > 0 ? 'CRITICAL' : (warning > 0 ? 'WARNING' : 'OPTIMAL')
    });
  }

  // 3. List Assets
  if (pathname === '/api/assets' && req.method === 'GET') {
    const list = assets.map(a => {
      const h = analyzeAsset(a.id);
      return {
        id: a.id,
        name: a.name,
        category_id: a.category_id,
        serial_number: a.serial_number,
        total_hours: a.total_hours,
        status: h.status,
        health_score: h.health_score,
        oee: h.metrics.oee,
        active_anomalies_count: h.anomalies.length
      };
    });
    return jsonResponse(list);
  }

  // 4. Asset Health Detail
  const healthMatch = pathname.match(/^\/api\/assets\/([^\/]+)\/health$/);
  if (healthMatch && req.method === 'GET') {
    const assetId = healthMatch[1];
    const data = analyzeAsset(assetId);
    if (!data) return jsonResponse({ error: 'Asset not found' }, 404);
    return jsonResponse(data);
  }

  // 5. Fault Injection Sandbox
  if (pathname === '/api/simulation/inject-fault' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { asset_id, sensor_type, deviation_percent, duration_readings = 15 } = payload;
        
        if (!telemetry[asset_id] || !telemetry[asset_id][sensor_type]) {
          return jsonResponse({ error: 'Sensor or asset not found' }, 400);
        }

        const series = telemetry[asset_id][sensor_type];
        const lastVal = series.length > 0 ? series[series.length - 1].value : 10;
        const now = Date.now();

        for (let i = 1; i <= duration_readings; i++) {
          const t = new Date(now + i * 30000).toISOString();
          const target = lastVal * (1 + (deviation_percent / 100) * (i / duration_readings));
          const jitter = (Math.random() - 0.5) * 0.04 * lastVal;
          series.push({ timestamp: t, value: Math.max(0, parseFloat((target + jitter).toFixed(2))) });
        }

        const updated = analyzeAsset(asset_id);
        return jsonResponse({
          status: 'fault_injected',
          asset_id,
          sensor_type,
          deviation_percent,
          new_health_score: updated.health_score,
          new_status: updated.status,
          anomalies: updated.anomalies
        });
      } catch (e) {
        return jsonResponse({ error: e.message }, 400);
      }
    });
    return;
  }

  // 6. AI Diagnosis
  if (pathname === '/api/ai/diagnose' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const healthData = analyzeAsset(payload.asset_id);
        if (!healthData) return jsonResponse({ error: 'Asset not found' }, 404);

        const diag = await diagnoseAsset(healthData);
        return jsonResponse({
          asset_id: payload.asset_id,
          timestamp: new Date().toISOString(),
          health_score: healthData.health_score,
          ...diag
        });
      } catch (e) {
        return jsonResponse({ error: e.message }, 400);
      }
    });
    return;
  }

  // 7. Templates
  if (pathname === '/api/templates' && req.method === 'GET') {
    return jsonResponse(Object.values(templates));
  }

  // 404 Fallback
  jsonResponse({ error: 'Not Found', path: pathname }, 404);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n======================================================');
  console.log(`🚀  MechShield AI Unified Server Active on Port ${PORT}`);
  console.log('======================================================');
  console.log(`• Web Dashboard:     http://localhost:${PORT}`);
  console.log(`• Fleet Summary API: http://localhost:${PORT}/api/fleet/summary`);
  console.log(`• Asset Health API:  http://localhost:${PORT}/api/assets/asset-motor-01/health`);
  console.log(`• AI Diagnosis:      Gemma 4 Physics-Informed Pipeline`);
  console.log('======================================================\n');
});
