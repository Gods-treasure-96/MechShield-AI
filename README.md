# 🛡️ MechShield AI: Universal Asset Health Management (AHM) Platform

> **Major League Hacking (MLH) Submission**  
> *Balancing Technical Depth (Deterministic Engineering), Architectural Elegance (Decoupled Micro-services), and "Wow" Factor (Gemma 4 Physics-Informed AI).*

---

## 📌 Problem & Executive Summary
Industrial plants, fleet managers, and mechanical operators face a painful dilemma:
- **Reactive Maintenance:** Fixing assets after catastrophic failure (causes downtime, safety risks, and thousands in emergency repair).
- **Preventive Maintenance:** Replacing parts strictly on a calendar timer (wastes up to 40% of useful component life).
- **Predictive Maintenance:** Historically locked behind multimillion-dollar proprietary enterprise software.

**MechShield AI** is an open, universal Asset Health Management platform. It introduces a **Universal Asset Wrapper** that abstracts any mechanical asset (from an induction motor to an internal combustion engine or a centrifugal pump) into a declarative JSON profile, combining **physics-based deterministic analysis** with **local generative AI (Gemma 4)**.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Data Sources & Ingestion
        S1["Sensors / IoT Telemetry Stream"]
        S2["Batch CSV Uploader"]
        S3["Virtual Fault Simulator"]
    end

    subgraph Presentation Layer
        UI1["Next.js / Tailwind CSS Dashboard"]
        UI2["FastAPI Embedded Interactive Command Center"]
        UI3["Swagger Interactive OpenAPI"]
    end

    subgraph Orchestration Layer (FastAPI)
        API["FastAPI Orchestrator"]
        DB[(SQLite Embedded Store)]
        TPL["Universal Profile Templates"]
    end

    subgraph Engineering Analysis Layer (NumPy / Physics)
        TH["Stage 1: Deterministic Threshold Check"]
        TR["Stage 2: Statistical 2σ Trend Drift Engine"]
        EQ["Stage 3: Physics Formulas (OEE, η, MTBF, Availability)"]
    end

    subgraph AI Interpretation Layer (Gemma 4)
        OLLAMA["Local Ollama API / Gemma 4"]
        REASON["Causal Reasoning Pipeline: [Observation] → [Cause] → [Action]"]
    end

    S1 --> API
    S2 --> API
    S3 --> API

    API <--> DB
    API <--> TPL
    API --> TH
    TH --> TR
    TR --> EQ
    EQ --> API

    API --> OLLAMA
    OLLAMA --> REASON
    REASON --> API

    API <--> UI1
    API <--> UI2
    API <--> UI3
```

---

## ⚡ The 3 Golden Machine Templates

| Asset Type | Primary Sensors Monitored | Compound Failure Modes | Failure Signatures |
| :--- | :--- | :--- | :--- |
| **Industrial Induction Motor (45kW)** | Vibration RMS (mm/s), Stator Temp (°C), 3-Phase Current (A) | Bearing Degradation, Stator Thermal Breakdown | Vibration $> 4.5\text{ mm/s}$ and Temp $> 78^\circ\text{C}$ |
| **End-Suction Centrifugal Pump** | Suction Pressure (bar), Discharge Pressure (bar), Flow ($m^3/h$), Cavitation Ultrasonic Index (g) | Impeller Cavitation Inception, Wear Ring Leakage | Suction $< 1.1\text{ bar}$ and Cavitation Index $> 1.2\text{ g}$ |
| **Internal Combustion Engine (2.0L Turbo)** | Coolant Temp (°C), Oil Pressure (bar), Misfire Counter (OBD-II), Fuel Rail Pressure (bar) | HPFP Lean Combustion Misfire, Thermal Runaway Lubricant Loss | Coolant $> 104^\circ\text{C}$ and Oil Pressure $< 2.1\text{ bar}$ |

---

## 📐 Mathematical & Reliability Framework

1. **Mechanical Efficiency ($\eta$):**
   $$\eta = \max\left(45.0, \min(99.0, 96.5 - (0.45 \times \text{AvgDrift}\%))\right)$$
2. **Operating Availability ($A$):**
   $$A = \max\left(60.0, 98.5 - (12.0 \times N_{\text{crit}}) - (3.5 \times N_{\text{warn}})\right)$$
3. **Mean Time Between Failures (MTBF):**
   $$\text{MTBF} = \frac{\text{Total Operating Hours}}{\max(1, \text{Failures} + N_{\text{crit}})}$$
4. **Overall Equipment Effectiveness (OEE):**
   $$\text{OEE} = \left(\frac{A}{100}\right) \times \text{Performance} \times \text{Quality} \times 100$$
5. **Statistical Anomaly ($2\sigma$ Z-Score):**
   $$z = \frac{x_t - \mu_{\text{rolling}}}{\sigma_{\text{rolling}}} \quad \text{Alert when } |z| \ge 2.0$$

---

## 🚀 Quickstart Guide

### 1. Requirements
- Python 3.10+
- Node.js 18+ (optional, if running standalone Next.js UI)
- Ollama with `gemma:4b` or `gemma2` (optional; deterministic physics fallback operates automatically if Ollama is offline)

### 2. Setup & Installation
```bash
# Clone and enter workspace
cd mechshield-ai

# Install Python requirements
pip install -r requirements.txt
```

### 3. Run the Platform
```bash
python run.py
```
- **Web Command Center:** [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Run Automated Test Suite
```bash
python test_pipeline.py
```

---

## 🔌 Core API Reference

- `GET /api/fleet/summary` — High-level fleet health counts and average OEE index.
- `GET /api/assets` — Retrieve list of all registered mechanical assets.
- `GET /api/assets/{id}/health` — Triggers deterministic calculation; returns health score, $2\sigma$ drifts, and reliability metrics.
- `POST /api/telemetry/ingest` — Ingest JSON batch telemetry readings.
- `POST /api/telemetry/upload-csv` — Ingest bulk historical CSV telemetry files.
- `POST /api/simulation/inject-fault` — Dynamically injects synthetic sensor deviations (+50% vibration, etc.) in real time.
- `POST /api/ai/diagnose` — Generates Gemma 4 causal reasoning report (`[Observation]` $\rightarrow$ `[Probable Cause]` $\rightarrow$ `[Recommended Action]`).
