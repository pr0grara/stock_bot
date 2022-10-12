const Trader = require('../models/Trader');
const LiquidatedTrader = require('../models/LiquidatedTrader');
const Sale = require('../models/Sale');
const mongoose = require('mongoose');
const CBP = require('../ccxt/coinbasepro');
const { idGenerator, SEND_SMS } = require('../util');

const makeNewTrader = async (asset, quantity, allowance) => {
    let id = idGenerator();
    let purchasePrice = await CBP.checkMarketPrice(asset + '/USD');
    let sellPrice = purchasePrice * 1.02;
    let rebuyPrice = purchasePrice;
    let receipt = await CBP.makeCoinbaseBuy(asset + "/USD", quantity);
    allowance = allowance || quantity * purchasePrice;

    let newTrader = new Trader({
        id,
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

const liquidateTrader = (trader, soldAtPrice) => {
    LiquidatedTrader.insertMany(trader)
        .then(() => Trader.findOneAndRemove({ id: trader.id }).catch(e => console.log(e)));
    CBP.makeCoinbaseSell(trader.asset + "/USD", trader.quantity)
        .then(res => {
            let purchaseAmnt = trader.quantity * trader.purchasePrice;
            let sellAmnt = trader.quantity * soldAtPrice;
            let profit = sellAmnt - purchaseAmnt;
            let purchaseDate = new Date(trader.date);
            let purchaseUnix = purchaseDate.getTime();
            let duration = Date.now() - purchaseUnix;
            duration = (duration / 1000 / 60 / 24).toFixed(1);
            let newSale = new Sale({
                id: idGenerator(),
                traderId: trader.id,
                asset: trader.asset,
                quantity: trader.quantity,
                purchasePrice: trader.purchasePrice,
                sellPrice: soldAtPrice,
                profit,
                duration
            })
            newSale.save();
            SEND_SMS(`Trader ${trader.id} sold ${trader.quantity} of ${trader.asset} at $${currentPrice}\nPurchase price was ${trader.purchasePrice}`);
            trader.update({
                quantity: 0,
                sellReceipt: res,
                liquidatedAt: Date()
            })
        })
        .catch(err => console.log(err))
};

const runAllTraders = async () => {
    let traders = await Trader.find({});
    let prices = {};

    for (const trader of traders) {
        if (trader.id === "6") {
            console.log(trader.id)
        }
        if (!prices[trader.asset]) {
            currentPrice = await CBP.checkMarketPrice(trader.asset + "/USD");
            prices[trader.asset] = currentPrice;
        } else {
            currentPrice = prices[trader.asset];
        }
        if (currentPrice >= trader.sellPrice) {
            console.log(`sell price met for ${trader.id}`)
            liquidateTrader(trader, currentPrice);
        } else {
            console.log(`sell price not met for ${trader.id}`)
        }
    }
    return traders;
}

module.exports = { makeNewTrader, runAllTraders };