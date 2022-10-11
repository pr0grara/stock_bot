const route = require('express').Router();
const Trader = require('../../models/Trader');
const CBP = require('../../ccxt/coinbasepro');
const { SEND_SMS } = require('../../util');
const { runAllTraders, makeNewTrader } = require('../../stock_util/trader');
const { Router } = require('express');

route.get('/', (req, res) => {
    res.status(200).send('trader home').end();
})

route.post('/run-all', async (req, res) => {
    let traders = await runAllTraders()
    res.status(200).json(traders).end();
})

route.post('/make-new', async (req, res) => {
    let asset = req.body.asset;
    let quantity = req.body.quantity;
    let newTrader = await makeNewTrader(asset, quantity);
    if (!!newTrader) res.status(200).json(newTrader).end();
})

module.exports = route;