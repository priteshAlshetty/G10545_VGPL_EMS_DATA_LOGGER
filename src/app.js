const express = require('express');
const app = express();


app.get('/', (req, res) => {
    res.send(' VGPL Data Logger service is running');
});

module.exports = app;
