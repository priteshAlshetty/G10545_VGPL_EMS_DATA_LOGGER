const app = require('./src/app');
const { startScheduler, stopScheduler } = require('./src/scheduler/scheduler');
const PORT = 3300;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // ✅ SCHEDULER STARTS HERE
    startScheduler();
});
/* Graceful shutdown */
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
    console.log('Shutting down service...');
    stopScheduler();
    server.close(() => process.exit(0));
}