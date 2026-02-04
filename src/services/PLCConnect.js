import { RETRYABLE_ERRORS } from '../constants/plc.retry.js';



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
    if (typeof plcIP !== 'string' || plcIP.length === 0){
        throw new TypeError(`Error in connecting PLC: plcIP must be a non-empty string: ${plcIP}`)
    }

    return new Promise((resolve, reject) => {
        client.ConnectTo(plcIP, rack, slot, (err) => {
            if(err){
                console.error('PLC Connect failed:', client.ErrorText(err));
                const error = new Error(client.ErrorText(err));
                error.code = err;
                error.source = 'PLC_CONNECT';
                error.message = client.ErrorText(err);

                return reject({
                    status: false,
                    error: error
                });
            }

            console.log('PLC Connected!');
            
            return resolve({
                status: true,
                error: null
            })
        })
    })
}