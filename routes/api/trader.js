const route = require('express').Router();
const Trader = require('../../models/Trader');
const CBP = require('../../ccxt/coinbasepro');

route.get('/', (req, res) => {
    res.status(200).send('trader home').end();
})

route.post('/run-all', async (req, res) => {
    console.log("#1#")
    let traders = await Trader.find({});
    console.log("#2#")
    traders.forEach(async trader => {
        console.log("#traderX#")
        let currentPrice = await CBP.checkMarketPrice(trader.asset + "/USD");
        console.log(currentPrice)
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
        console.log("#traderXEND#")
    })
    console.log("3")
    res.status(200).json(traders).end();
})

module.exports = route;