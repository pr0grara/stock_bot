const express = require('express');
const { analyze } = require('../../stock_util/coinbasepro/analyze');
const route = express.Router();

route.get('/', async (req, res) => {
    let query = req.query;
    let asset = query.asset;
    let product_id = asset + "-USD";
    let analysis = await analyze(product_id);
    res.status(200).send(analysis).end();
});

route.get('/candle?params', (req, res) => {
    res.send('success')
});

module.exports = route;