
import snap7 from 'node-snap7';
export function createPLCClient(){
    return new snap7.S7Client()
}

// Connect to PLC using s7 / snap7 libray and monitor the PLC status.
export async function connectPLC( {client, plcIP, rack, slot} ){
    if (!client) {
        throw new Error('Error in connecting PLC: PLC client is required');
    } 
    if(!Number.isInteger(rack)){
        throw new TypeError(`Error in connecting PLC: rack must be a positive integer: ${rack}`);
    }  
    if(!Number.isInteger(slot)){
        throw new TypeError(`Error in connecting PLC: slot must be a positive integer: ${slot}`);
    } 
    if(!typeof plcIP === 'string' || plcIP.length === 0){
        throw new TypeError(`Error in connecting PLC: plcIP must be a non-empty string: ${plcIP}`)
    }

    return new Promise((resolve, reject) => {
        client.ConnectTo(plcIP, rack, slot, (err) => {
            if(err){
                console.error('PLC Connecte failed:', client.ErrorText(err));
                console.log('Error in connecting PLC:', err);
                return reject(err)
            }
            console.log('PLC Connected!');
            resolve(true)
        })
    })
}