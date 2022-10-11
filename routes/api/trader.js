const route = require('express').Router();
const Trader = require('../../models/Trader');
const CBP = require('../../ccxt/coinbasepro');
const { SEND_SMS } = require('../../util');
const { runAllTraders } = require('../../stock_util/trader');
const { Router } = require('express');

route.get('/', (req, res) => {
    res.status(200).send('trader home').end();
})

route.post('/run-all', async (req, res) => {
    let traders = await runAllTraders()
    res.status(200).json(traders).end();
})

route.post('/make-new', async (req, res) => {
    let asset = req.data.asset;
    let quantity = req.data.quantity;
    let newTrader = await newTrader(asset, quantity);
})

module.exports = route;