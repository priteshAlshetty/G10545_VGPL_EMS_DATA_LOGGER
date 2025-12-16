cat <<'EOF' > README.md
# Logger Service (OPC UA → MySQL)

## Overview

This project is a **configurable industrial Data Logger Service** built with **Node.js**, designed to:

- Read data from **OPC UA servers (PLCs)**
- Log data into **MySQL**
- Scale by **adding more meters via API**
- Run continuously in the background
- Expose **health and status APIs**
- Operate safely in industrial environments

The logger is designed as a **standalone service** and is **microservice-ready**.  
Future services like analytics, reporting, dashboards, user management, and SAP integration will be developed separately.

---

## Key Features

- OPC UA → MySQL data logging
- Meter-based architecture (1 meter = 1 table = 1 row per cycle)
- Fixed logging interval (~30 seconds)
- Runtime configuration via REST APIs (no restart required)
- Enable / disable meters dynamically
- Automatic table creation for new meters
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

- Interval: ~30 seconds
- One cycle:
 - Read all enabled meters
 - Build JSON payload (1 object per meter)
 - Insert one row per meter
- Uses database timestamps (not PLC timestamps)
- No overlapping cycles
 - This guarantees:
    - Stable performance
    - Predictable load
    - Approx. 30-second gap between consecutive readings per meter

    --- 
## Database Concepts
### Meters

 - Logical unit of logging
 - Each meter maps to one MySQL table
 - Enable / disable controls logging

### Tags

 - OPC UA NodeId ↔ SQL column mapping
 - Belong to exactly one meter
 - Can be enabled / disabled individually

### Health Tracking

 - last_logged_at per meter
 - Error logs stored separately
 - Used by health APIs

 ## API Overview

The Logger Service exposes REST APIs to configure meters, control the scheduler, and monitor health.
All configuration changes take effect **at runtime** without restarting the service.

---


