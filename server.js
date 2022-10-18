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
const { CREATE_LOOP } = require('./util');
const { runAllTraders, analyzeAssetsAndBuy } = require('./stock_util/trader');
const { reviewTradersSellTargets, updateAllAssets } = require('./stock_util/coinbasepro/analyze');
app.use('/api/trader', traderRoutes);
app.use('/api/analyze', analyzeRoutes);

app.get('/', (req, res) => {
    res.send('stockbot home')
});

if (config.PROD) CREATE_LOOP(runAllTraders, 0.5);
// if (config.PROD) CREATE_LOOP(() => analyzeAssetsAndBuy(10), .95);
if (config.PROD) CREATE_LOOP(() => reviewTradersSellTargets(), 60);
if (config.PROD) CREATE_LOOP(() => updateAllAssets(), 60);
if (config.PROD) CREATE_LOOP(() => checkForBuyPositions().then(res => {
    let [ shortPositions, longPositions] = [res.shortPositions, res.longPositions ];
    longPositions.forEach(buyParams => makeNewTrader(buyParams, true))
    shortPositions.forEach(buyParams => makeNewTrader(buyParams, true))
}), 60);



app.listen(PORT, () => console.log(`StockBot listening on port ${PORT}`));