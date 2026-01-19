const cron = require('node-cron');
// import other necessary modules and functions
//TODO: import function to connect PLC and read data
const SCHEDULE_STRING = '*/5 * * * * *'; // every 5 seconds for testing, change as needed
let task;
const DB_LIST = [];

function startScheduler() {
    task = cron.schedule(SCHEDULE_STRING, async () => {
        try {
            //TODO: connect PLC
            for (const db in DB_LIST) {
                //TODO: read data from PLC for DB_LIST[db]
                //TODO: insert data in PGSQL database
                //throw new Error('Test error'); // uncomment to test error handling
            }
            console.log('Scheduled task executed successfully at :', new Date().toLocaleString());
        }

        catch (error) {
            console.error('Error in scheduled task:', error);
        }


    });
}

function stopScheduler() {
    if (task) {
        task.stop();
    }
}

module.exports = {
    startScheduler,
    stopScheduler
};