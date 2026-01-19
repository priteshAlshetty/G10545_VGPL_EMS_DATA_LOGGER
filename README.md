cat <<'EOF' > README.md
# Logger Service (S7 → postgresSQL)

## Overview

This project is a **configurable industrial Data Logger Service** built with **Node.js**, designed to:

- Read data from **S7 servers (PLCs)**
- Log data into **postgresSQL**
- Scale by **adding more meters via static meter.config.js**
- Run continuously in the background
- Expose **health and status APIs**
- Operate safely in industrial environments

The logger is designed as a **standalone service** and is **microservice-ready**.  
Future services like analytics, reporting, dashboards, user management, and SAP integration will be developed separately.

---

## Key Features

- Profinet S7 → postgresSQL data logging
- Meter-based architecture (1 meter = 1 table = 1 row per cycle)
- Fixed logging interval (~30 seconds)
- restart required if config files updated
- all meters enabled by default as per config 
- template sql to create Table for new meter , need to run once upon new meter added
- Background scheduler (no `setInterval`, no infinite loops)
- Health & status APIs for monitoring
- Error logging (application + meter level)
- PM2 / multi-core ready
- Production-grade folder structure

---

## Architecture Summary
Logger Service
``` bash
├── Express API
│ ├── Meter configuration
│ ├── Scheduler control
│ └── Health endpoints
│
├── Scheduler Engine (self-rescheduling loop)
│
├── OPC UA Reader
│
├── Data Logger (postgresSQL writer)
│
└── Health Monitor
```

**Design principles:**
- Logger is **write-only** for process data
- Other services consume data by reading the database
- No analytics, reporting, or business logic inside logger

---

## Project file Structure

``` bash
logger-service/
├── package.json
├── .env
├── ecosystem.config.js
├── README.md
│
└── src/
    ├── server.js              # Single entry point
    ├── app.js                 # Express app
    │
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   └── opcua.js
    │
    ├── scheduler/
    │   ├── scheduler.js
    │   ├── cycleRunner.js
    │   └── meterRunner.js
    │
    ├── services/
    │   ├── meter.service.js
    │   ├── tag.service.js
    │   ├── datalogger.service.js
    │   ├── health.service.js
    │   └── opcua.service.js
    │
    ├── routes/
    │   ├── meters.routes.js
    │   ├── scheduler.routes.js
    │   └── health.routes.js
    │
    ├── utils/
    │   ├── promisePool.js
    │   ├── logger.js
    │   └── shutdown.js
    │
    └── constants/
        ├── scheduler.constants.js
        └── status.constants.js

```
    ---

## Logging Model

- Interval: 1~30 seconds
- One cycle:
 - Read all enabled meters
 - Build JSON payload (1 object per meter)
 - Insert one row per meter
- Uses database timestamps (not PLC timestamps)
- No overlapping cycles
 - This guarantees:
    - Stable performance
    - Predictable load
    - Approx. 30-second or less gap between consecutive readings per meter

    --- 
## Database Concepts
### Meters

 - Logical unit of logging
 - Each meter maps to one MySQL table

### Tags

 - PLC DB structure is consistent 1 DB= 72 Meters , one DB per location
 - Any Location can have 72 or less meter , if more new DB will be formed
 - Meter status by another Bool Tag will be monitored

### Health Tracking

 - last_logged_at per meter
 - Error logs stored separately in logs
 - Used by health APIs

 ## API Overview

The Logger Service exposes REST APIs  monitor meter health , and PLC conn. Also an endpoint for latest Timestamp where data inserted.

---


