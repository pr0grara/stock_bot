const Trader = require('../models/Trader');
const mongoose = require('mongoose');
const CBP = require('../ccxt/coinbasepro');

const MakeNewTraderInstance = async (asset, quantity, allowance) => {
    mongoose.connect(process.env.AZBSTOCKBOT_MONGO);

    let purchasePrice = await checkMarketPrice(asset + '/USD');
    let sellPrice = purchasePrice * 1.02;
    let rebuyPrice = purchasePrice;
    let receipt = await makeCoinbaseBuy(asset + "/USD", quantity);
    allowance = allowance || quantity * price;

    let newTrader = new Trader({
        id: idGenerator(),
        asset,
        quantity,
        purchasePrice,
        sellPrice,
        rebuyPrice,
        allowance,
        receipt
    })
    newTrader.save()
        .then(res => console.log(res))
        .catch(err => console.log("ERROR", err));
}

const runAllTraders = async () => {
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
}

module.exports = { runAllTraders };