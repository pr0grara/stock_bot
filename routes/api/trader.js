const route = require('express').Router();
const Trader = require('../../models/Trader');
const CBP = require('../../ccxt/coinbasepro');

route.get('/', (req, res) => {
    res.status(200).send('trader home').end();
})

route.post('/run-all', async (req, res) => {
    let traders = await Trader.find({});
    traders.forEach(async trader => {
        let currentPrice = await CBP.checkMarketPrice(trader.asset + "/USD");
        if (currentPrice >= trader.sellPrice) {
            console.log(`sell price met for ${trader.id}`)
            CBP.makeCoinbaseSell(trader.asset + "/USD", trader.quantity)
                .then(res => {
                    trader.update({
                        quantity: 0,
                        sellReceipt: res,
                        liquidatedAt: Date()
                    })
                })
                .catch(err => console.log(err))
        } else {
            console.log(`sell price not met for ${trader.id}`)
        }
    })
    res.status(200).json(traders).end();
})

module.exports = route;