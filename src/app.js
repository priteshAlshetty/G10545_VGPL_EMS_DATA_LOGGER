import express from 'express';

export const app = express();

app.get('/', (req, res) => {
    res.status(200).send('VGPL Data Logger service is running');
});

