require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const ccxt = require('ccxt');
const axios = require('axios');
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.AZBSTOCKBOT_MONGO)
    .then(() => console.log('connected to mongo'))
    .catch(() => console.log('error connecting to mongo'));

app.use(express.json());

const traderRoutes = require('./routes/api/trader');
const { CREATE_LOOP } = require('./util');
const { runAllTraders } = require('./stock_util/trader');
app.use('/api/trader', traderRoutes);

app.get('/', (req, res) => {
    res.send('stockbot home')
});

CREATE_LOOP(runAllTraders, 0.5)

app.listen(PORT, () => console.log(`StockBot listening on port ${PORT}`));