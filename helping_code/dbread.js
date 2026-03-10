import snap7 from 'node-snap7';
const client = new snap7.S7Client();

const meter_names = ["htsb1mfm1","htsb1mfm2","htsb1mfm3","htsb1mfm4","htsb1mfm5"];

async function readDBData( {client, DB_number, rack, slot, plc_ip, meter_names, 
    meter_count, meter_size, RECONNECT_DELAY, POLL_INTERVAL} ){

    const total_bytes = meter_size * meter_count;

    let plcConnected = false;
    let pollTimer = null;
    let reconnecting = false;

    // read safely
    async function readFloatSafe(buf, offset){
        try{
            if(offset + 4 > buf.length) return null;
            let val = await buf.readFloatBE(offset)
            return Number.isFinite(val) ? val : null;
        } catch{
            return null;
        }
    }


    async function connectPLC(){
        client.ConnectTo(plc_ip, rack, slot, (err) => {
            if(err){
                console.error('PLC connection failed:', client.ErrorText(err));
                setTimeout(connectPLC, RECONNECT_DELAY);
                return;
            }

            plcConnected = true;
            console.log('Connected to plc...');
        })

        return meterData();
    }

    async function readPLCDB(){
        return new Promise((resolve, reject) => {
            client.DBRead(DB_number, 0, total_bytes, (err, data) => {
                if(err) return reject(err);
                if(data.length != total_bytes){
                    return reject(new Error('Partial DB read'));
                }

                resolve(data)
            });
        });
    }

    await connectPLC();

    async function meterData(){
        
        let buf = await readPLCDB();
        let result = {};

        for(let i = 0; i < meter_count; i++){

            let base = i * meter_size;
            const meter = meter_names[i];

            result[meter] = {
                CURRENT_I1: readFloatSafe(buf, base + 0),
                CURRENT_I2: readFloatSafe(buf, base + 4),
                CURRENT_I3: readFloatSafe(buf, base + 8),
                VOLTAGE_V1: readFloatSafe(buf, base + 12),
                VOLTAGE_V2: readFloatSafe(buf, base + 16),
                VOLTAGE_V3: readFloatSafe(buf, base + 20),
                FREQUENCY: readFloatSafe(buf, base + 24),
                KW: readFloatSafe(buf, base + 28),
                KWH: readFloatSafe(buf, base + 32),
                COS_PHI: readFloatSafe(buf, base + 36),
                KW_DEMAND: readFloatSafe(buf, base + 40),
                CUMULATIVE_THD_I: readFloatSafe(buf, base + 44),
                CUMULATIVE_THD_V: readFloatSafe(buf, base + 48),
                KVA: readFloatSafe(buf, base + 52),
                KVAR: readFloatSafe(buf, base + 56),
                SPARE1: readFloatSafe(buf, base + 60),
                SPARE2: readFloatSafe(buf, base + 64),
                SPARE3: readFloatSafe(buf, base + 68)               
            }
        }
        return result;
    }




    // disconnect or shutdown.
    process.on('SIGINT', () => {
        console.log('Ctrl+C pressed, process will shutdown.');
        client.Disconnect();
        process.exit(0);
    });

    //console.log(connectPLC());
    
}
readDBData({client: client, DB_number: 1, rack: 0, slot: 1, plc_ip: '192.168.0.205',
    meter_names: meter_names, meter_count: 5, meter_size: 72, RECONNECT_DELAY: 5000, POLL_INTERVAL: 5000
}).then(data => console.dir(data))
.error(err => console.err(err))

// console.log(data);