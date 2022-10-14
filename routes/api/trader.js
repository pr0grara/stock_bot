const route = require('express').Router();
const { runAllTraders, makeNewTrader, analyzeAssetsAndBuy } = require('../../stock_util/trader');

route.get('/', (req, res) => {
    res.status(200).send('trader home').end();
})

route.post('/run-all', async (req, res) => {
    let traders = await runAllTraders()
    res.status(200).json(traders).end();
})

route.post('/make-new', async (req, res) => {
    let buyParams = {
        asset: req.body.asset,
        quantity: req.body.quantity,
        usd: req.body.usd,
        profitTarget: req.body.profitTarget
    };
    let newTrader = await makeNewTrader(buyParams, false);
    if (!!newTrader) res.status(200).json(newTrader).end();
});

route.get('/test-new', (req, res) => {
    analyzeAssetsAndBuy(10);
    res.status(200).send('tesdt').end()
})

module.exports = route;