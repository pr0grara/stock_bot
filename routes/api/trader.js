const route = require('express').Router();
const Trader = require('../../models/Trader');

route.get('/', (req, res) => {
    res.status(200).send('trader home').end();
})

route.post('/run-all', async (req, res) => {
    let traders = await Trader.find({});
    console.log(traders)
    res.status(200).json(traders).end();
})

module.exports = route;