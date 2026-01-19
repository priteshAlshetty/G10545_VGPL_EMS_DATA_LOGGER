const app = require('./src/app');

const PORT = 3300;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
