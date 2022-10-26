require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3000;
const config = require('./config');

mongoose.connect(process.env.AZBSTOCKBOT_MONGO)
    .then(() => console.log('connected to mongo'))
    .catch((err) => console.log('error connecting to mongo: ', err));

app.use(express.json());

const traderRoutes = require('./routes/api/trader');
const analyzeRoutes = require('./routes/api/analyze');
const authorizeRoutes = require('./routes/api/authorize');
const { CREATE_LOOP } = require('./util');
const { runAllTraders, makeNewTrader } = require('./stock_util/trader');
const { reviewTradersSellTargets, updateAllAssets, buyPositions } = require('./stock_util/coinbasepro/analyze');
const { cleanTokens } = require('./authorize_util');
app.use('/api/trader', traderRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/authenticate', authorizeRoutes);

app.get('/', (req, res) => {
    res.send('stockbot home')
});


if (config.PROD) CREATE_LOOP(runAllTraders, 0.5);
if (config.PROD) CREATE_LOOP(cleanTokens, 30);
if (config.PROD) CREATE_LOOP(async () => {
    await reviewTradersSellTargets()
    await updateAllAssets()
    await buyPositions(makeNewTrader);
}, 90);

app.listen(PORT, () => console.log(`StockBot listening on port ${PORT}`));