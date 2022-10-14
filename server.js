require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3000;
const config = require('./config');

mongoose.connect(process.env.AZBSTOCKBOT_MONGO)
    .then(() => console.log('connected to mongo'))
    .catch(() => console.log('error connecting to mongo'));

app.use(express.json());

const traderRoutes = require('./routes/api/trader');
const analyzeRoutes = require('./routes/api/analyze');
const { CREATE_LOOP } = require('./util');
const { runAllTraders, analyzeAssetsAndBuy } = require('./stock_util/trader');
app.use('/api/trader', traderRoutes);
app.use('/api/analyze', analyzeRoutes);

app.get('/', (req, res) => {
    res.send('stockbot home')
});

if (config.PROD) CREATE_LOOP(runAllTraders, 0.5);
if (config.PROD) CREATE_LOOP(() => analyzeAssetsAndBuy(10), .95);

app.listen(PORT, () => console.log(`StockBot listening on port ${PORT}`));