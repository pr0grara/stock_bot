const Trader = require('../models/Trader');
const mongoose = require('mongoose');
const CBP = require('../ccxt/coinbasepro');
const { SEND_SMS } = require('../util');

const makeNewTrader = async (asset, quantity, allowance) => {
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
    });
    newTrader.save()
        .then(res => {
            console.log(res);
            SEND_SMS(`New trader ${id} created. Position: ${quantity} X ${asset} @ ${purchasePrice}`);
        })
        .catch(err => console.log("ERROR", err));
    return newTrader;
}

const runAllTraders = async () => {
    let traders = await Trader.find({});
    traders.forEach(async trader => {
        let currentPrice = await CBP.checkMarketPrice(trader.asset + "/USD");
        if (currentPrice >= trader.sellPrice) {
            console.log(`sell price met for ${trader.id}`)
            CBP.makeCoinbaseSell(trader.asset + "/USD", trader.quantity)
                .then(res => {
                    SEND_SMS(`Trader ${trader.id} sold ${trader.quantity} of ${trader.asset} at $${currentPrice}\nPurchase price was ${trader.purchasePrice}`);
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
    return traders;
}

module.exports = { makeNewTrader, runAllTraders };