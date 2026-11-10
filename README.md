# Asset Integrity & Reliability — public demo

A static, no-login build of the **Asset Integrity & Reliability** app (Oil, Gas & Energy use case 12 in
[`mfg-use-cases`](https://github.com/sfc-gh-dfreriks/mfg-use-cases)), deployed to GitHub Pages:

**https://sfc-gh-dfreriks.github.io/mfg-asset-integrity-public/**

The app answers an upstream operator's question: *"Which critical assets will fail or leak next, and how much production is
at risk?"* It reads two SAP instances, each as SAP ECC, S/4HANA, BW/4HANA or SAP BDC (plant maintenance: functional
locations, equipment, notifications, orders, plans, measurements, plus IS-Oil style wells and downtime), together with a
process historian (sensor tags, daily and hourly values, alarms), an inspection / risk-based inspection system (CML wall
thickness, corrosion rate, remaining life) and a methane LDAR programme (surveys, leaks, repair status). The data flows
through dbt staging adapters, a canonical silver layer and gold marts on Snowflake, then to a semantic view, a Cortex Agent
and this React app.

**Data caveats:** all data is synthetic, for a fictional operator (Lonestar Energy, four basins, 24 months to 2026-09-30).
The historian, inspection and LDAR systems are simulated. The IS-Oil well and downtime tables are representative,
IS-Oil-style tables, not a verified SAP dictionary layout. SAP BDC has no IS-Oil data products, so with BDC (or BW) as the
source, wells, downtime and production at risk are reported as coverage gaps.

**Pages:** Ask Cortex · Executive Dashboard · Asset Risk · Work Orders & Backlog · Failure Modes · Sensor Trends ·
Inspections · Methane & LDAR · Data Sources · Field Mapping · SAP Metadata · Sources & Lineage (dbt) · Pipeline in 3D

## How the public build works

- **Snapshot:** built with `VITE_STATIC=1`, the client reads pre-baked JSON in `public/data/` instead of a live `/api`.
  There is no Snowflake connection and no credentials are required. Source selection in the snapshot: SAP A = ECC,
  SAP B = S/4HANA, historian, inspections and LDAR on.
- **Filters:** every basin subset with all equipment classes is baked, and so are all basins or one basin with each
  single equipment class. Other combinations fall back to the nearest baked view.
- **Ask Cortex:** answers are pre-generated for each page's default analysis and every suggested question. Free-text
  questions need the full deployment.
- **Data Sources:** browse each source type and preview its native tables. Apply (which runs dbt in Snowflake) is disabled.

## Full deployment

For live queries, source switching and free-text Ask Cortex, deploy from the source repo:
```bash
git clone https://github.com/sfc-gh-dfreriks/mfg-use-cases
cd mfg-use-cases/use_cases/12_asset_integrity
tools/build_local.sh          # data -> bronze -> config -> adapters -> dbt -> semantic view -> agent
cd app && npm install && npm run dev   # http://localhost:5197
```
See [use_cases/12_asset_integrity/README.md](https://github.com/sfc-gh-dfreriks/mfg-use-cases/blob/main/use_cases/12_asset_integrity/README.md) for full setup instructions.
