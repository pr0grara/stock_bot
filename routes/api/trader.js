const route = require('express').Router();
const { runAllTraders, makeNewTrader } = require('../../stock_util/trader');

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
        profitTarget: req.body.profitTarget
    };
    let newTrader = await makeNewTrader(buyParams, false);
    if (!!newTrader) res.status(200).json(newTrader).end();
})

module.exports = route;