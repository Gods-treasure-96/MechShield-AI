# 🛡️ MechShield AI: The 2-Minute MLH Hackathon Pitch & Live Demo Guide

> **Tagline:** Universal Physics-Informed Predictive Maintenance & Asset Reliability Ecosystem.  
> **Target Audience:** MLH Judges, Reliability Engineers, Industrial & Automotive Asset Managers.

---

## ⏱️ The 2-Minute Demo Script (Word-for-Word Walkthrough)

### 1. The Hook (0:00 - 0:30)
> *"Judges, industrial and automotive maintenance is broken. We either wait for a $50,000 engine or pump to violently fail—costing hours of catastrophic downtime—or we replace expensive components on an arbitrary timer, throwing away perfectly good equipment.*
>
> *High-end factories have predictive maintenance teams, but small-to-medium operators and fleet managers have nothing universal.*
>
> *Meet **MechShield AI**. We don't just alert you when a machine breaks—**we track the continuous decay of physical productivity** before failure occurs."*

**Action on Screen:**
- Display the **Fleet Overview** at `http://localhost:8000`.
- Point out the 3 Golden Templates:
  - 🟢 **Industrial Induction Motor (45kW):** Healthy / Baseline Nominal (Health Score: 98%).
  - 🟡 **Centrifugal Water Pump:** Warning (Cavitation drift, 2σ statistical deviation, Health Score: 72%).
  - 🔴 **2.0L Turbo Automobile Engine:** Critical (Thermal runaway & oil hydrodynamic drop, Health Score: 41%).

---

### 2. The Deep Dive: Deterministic Math vs AI (0:30 - 1:15)
> *"Here is our core engineering innovation: **The Hybrid Intelligence Pipeline**.
> Most hackathon projects feed raw sensor numbers directly to an LLM, causing hallucinations.
>
> Instead, MechShield uses a **Universal Asset Wrapper**: a JSON profile defining physical limits and failure mode boolean logic.
>
> Our **Python Deterministic Engine** calculates:
> 1. Exact ISO threshold breaches.
> 2. Statistical rolling $2\sigma$ trend anomalies.
> 3. Physics metrics: Mechanical Efficiency ($\eta$), Operating Availability ($A$), MTBF, and Overall Equipment Effectiveness (OEE)."*

**Action on Screen:**
- Click on the **Centrifugal Pump** card.
- Show the **OEE Gauge Strip** (OEE index, Mechanical Efficiency $\eta$, MTBF).
- Show the **Stage 1 & 2 Deterministic Log**: point out the `2.4σ` statistical drift on cavitation acoustic energy.

---

### 3. The Interactive "Wow" Moment: Virtual Fault Injection (1:15 - 1:45)
> *"Watch what happens when an unexpected fault strikes. Using our built-in **Virtual Sensor Simulator**, let's inject a +50% vibration spike on our Compressor Motor."*

**Action on Screen:**
- Click on **Industrial Motor**.
- In the **Virtual Sensor Fault Simulator** box on the right:
  - Select `vibration (mm/s)`.
  - Drag slider to `+50%`.
  - Click **"Inject Fault & Trigger Pipeline"**.
- Watch the chart spike in real time, the card change to `WARNING`, and the bearing degradation rule trip.
- Click **"Analyze with Gemma 4"**.
- Watch Gemma 4 render the structured report in under 2 seconds:
  - **[OBSERVATION]:** Breached 4.65 mm/s vs 4.5 mm/s limit.
  - **[PROBABLE CAUSE]:** Bearing raceway micro-spalling or grease dry-out causing frictional heating.
  - **[RECOMMENDED INSPECTION STEP]:** Acoustic lubrication test and shaft alignment check.

---

### 4. The Close (1:45 - 2:00)
> *"MechShield AI eliminates hallucinations by grounding generative AI in deterministic physics. It works identically for an electric motor, an industrial pump, or an automobile engine. 
> 
> **Zero unplanned downtime. Maximum productivity.** 
> Thank you, and we'd love to answer any questions!"*

---

## 🎯 Judge Q&A Preparation Matrix

| Anticipated Judge Question | Best Technical Answer |
| :--- | :--- |
| **"Why not just use an LLM for everything?"** | *"LLMs are notoriously bad at numerical thresholding and rolling mathematical drift ($2\sigma$), leading to catastrophic hallucinations in safety-critical industrial settings. By letting Python & NumPy handle the math, the AI acts as a senior diagnostic consultant interpreting verified engineering facts."* |
| **"How hard is it to support a new machine?"** | *"It takes less than 60 seconds. You simply write a JSON 'Machine Profile' specifying sensor names, units, warning/critical thresholds, and compound failure formulas. No code changes required."* |
| **"Can this run in disconnected / air-gapped environments?"** | *"Yes! MechShield runs completely on-premise using FastAPI, SQLite, and local Gemma 4 via Ollama. No proprietary cloud vendor lock-in."* |
| **"How do you calculate OEE?"** | *"We use standard industrial reliability math: $\text{OEE} = \text{Availability} \times \text{Performance} \times \text{Quality}$, where Availability reflects uptime deductions from critical anomalies, and Performance reflects continuous efficiency drift relative to nominal baseline."* |

---

## 🛠️ Rapid Demo Commands

1. **Start Server:**
   ```bash
   python run.py
   ```
2. **Open Dashboard:**
   ```text
   http://localhost:8000
   ```
3. **Open Swagger API Docs:**
   ```text
   http://localhost:8000/docs
   ```
