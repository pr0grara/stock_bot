const Trader = require('../models/Trader');
const LiquidatedTrader = require('../models/LiquidatedTrader');
const Sale = require('../models/Sale');
const CBP = require('../ccxt/coinbasepro');
const { idGenerator, SEND_SMS } = require('../util');
const { analyze, buyBool } = require('./coinbasepro/analyze');


const makeNewTrader = async (buyParams, autoBool) => {
    let [asset, quantity, usd, profitTarget] = [buyParams.asset, buyParams.quantity, buyParams.usd, buyParams.profitTarget];
    if (!profitTarget) profitTarget = 1.03;
    let id = idGenerator();
    let purchasePrice = await CBP.checkMarketPrice(asset + '/USD');
    if (!!usd) quantity = usd / purchasePrice;
    let sellPrice = purchasePrice * profitTarget;
    let rebuyPrice = purchasePrice;
    let receipt = await CBP.makeCoinbaseBuy(asset + "/USD", quantity);
    let allowance = quantity * purchasePrice;

    let newTrader = new Trader({
        id,
        asset,
        quantity,
        purchasePrice,
        sellPrice,
        rebuyPrice,
        allowance,
        receipt,
        botBuy: !!autoBool
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
        let currentPrice;
        if (!prices[trader.asset]) {
            currentPrice = await CBP.checkMarketPrice(trader.asset + "/USD");
            prices[trader.asset] = currentPrice;
        } else {
            currentPrice = prices[trader.asset];
        };

        if (currentPrice >= trader.sellPrice) {
            console.log(`sell price met for ${trader.id}`);
            liquidateTrader(trader, currentPrice);
        } else {
            console.log(`sell price not met for ${trader.id}`);
        };
    }
    return traders;
};

const analyzeAssetsAndBuy = async (usdAllowance) => {
    if (!usdAllowance) return;
    let funds = await CBP.checkCoinbaseFunds();
    if (funds.USD < 10) return;
    let traders = await Trader.find({});
    let assets = ["ETH", "ADA", "DOGE", "LTC", "BTC"];

    for (const asset of assets) {
        let lastPurchases = traders.filter(trader => trader.asset === asset);
        if (lastPurchases.length === 0) continue;
        let lastPurchase = lastPurchases[lastPurchases.length - 1];
        let lastPurchased = lastPurchase.unix;
        if (Date.now() - (1000 * 60 * 30) - lastPurchased < 0) continue; //if purchase was made within 30 min then do not purchase same asset again
        let analysis = await analyze(asset + "-USD");
        let bool = await buyBool(analysis);
        if (bool === true) {
            let buyParams = {
                asset,
                quantity
            }
            let quantity = usdAllowance / analysis.currentPrice;
            console.log("BUY TEST PASSED FROM ANALYSIS: ", JSON.stringify(analysis))
            makeNewTrader(buyParams, true);
        }
    }
}

module.exports = { makeNewTrader, runAllTraders, analyzeAssetsAndBuy };