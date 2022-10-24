const route = require('express').Router();
const { runAllTraders, makeNewTrader, analyzeAssetsAndBuy } = require('../../stock_util/trader');
const { checkForBuyPositions } = require('../../stock_util/coinbasepro/analyze');

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

route.get('/check', (req, res) => {
    checkForBuyPositions().then(data => res.status(200).json(data).end()).catch(() => res.status(500).send('error checking for buy positions').end());
});

route.get('/check-and-buy-long', (req, res) => {
    checkForBuyPositions().then(data => {
        res.status(200).json(data).end();
        if (!data) return;
        let longPositions = data.longPositions;
        longPositions.forEach(buyParams => makeNewTrader(buyParams, true))
    })
})

route.get('/check-and-buy-short', (req, res) => {
    checkForBuyPositions().then(data => {
        res.status(200).json(data).end();
        if (!data) return;
        let shortPositions = data.shortPositions;
        shortPositions.forEach(buyParams => makeNewTrader(buyParams, true))
    })
})

// route.get('/test-new', (req, res) => {
//     analyzeAssetsAndBuy(10);
//     res.status(200).send('tesdt').end()
// })

module.exports = route;