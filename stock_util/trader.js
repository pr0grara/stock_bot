const Trader = require('../models/Trader');
const LiquidatedTrader = require('../models/LiquidatedTrader');
const Sale = require('../models/Sale');
const CBP = require('../ccxt/coinbasepro');
const { idGenerator, SEND_SMS } = require('../util');
const { analyze, buyBool } = require('./coinbasepro/analyze');


const makeNewTrader = async (buyParams, botBuyBool) => {
    let [asset, quantity, usd, profitTarget, strat] = [buyParams.asset, buyParams.quantity, buyParams.usd, buyParams.profitTarget, buyParams.strat];
    if (!profitTarget) profitTarget = 1.022;
    let id = idGenerator();
    let purchasePrice = await CBP.checkMarketPrice(asset + '/USD');
    if (!!usd) quantity = usd / purchasePrice;
    let sellPrice = purchasePrice * profitTarget;
    let rebuyPrice = purchasePrice;
    let receipt = await CBP.makeCoinbaseBuy(asset + "/USD", quantity);
    // let receipt = await CBP.makeCoinbaseBuy(asset + "/USD", quantity);
    let principal = quantity * purchasePrice;
    let botBuy = !!botBuyBool;

    let newTrader = new Trader({
        id,
        asset,
        quantity,
        purchasePrice,
        sellPrice,
        rebuyPrice,
        profitTarget,
        principal,
        receipt,
        botBuy,
        strat,
        date: Date(),
        unix: Date.now()
    });

    newTrader.save()
        .then(res => {
            console.log(res);
            SEND_SMS(`New trader ${id} created. Position: ${quantity} X ${asset} @ ${purchasePrice}`);
        })
        .catch(err => console.log("ERROR", err));
    return newTrader;
}

const confirmInsuficientFunds = async (trader, id) => {
    if (!!id) trader = await Trader.findOne({ id });
    
    let asset = trader.asset;
    let assetBalance = (await CBP.getCoinbaseBalances())["total"][asset];
    return (trader.quantity > assetBalance) ? assetBalance : false;
}

const deleteTrader = async (id) => {
    let deleted = await Trader.deleteOne({ id });
    console.log(deleted);
    if (!!deleted) return true;
    return false;
};

const forceLiquidateTrader = async (trader, id, assetBalance) => {
    if (!!id) trader = await Trader.findOne({ id });

    let sold = await CBP.makeCoinbaseSell(trader.asset + "/USD", assetBalance);
    if (!!sold) {
        let mongoReceipt = await deleteTrader(trader.id);
        if (mongoReceipt.deletedCount > 0) return true;
        return false;
    }
};

const liquidateTrader = (trader, soldAtPrice) => {
    // let principalQuant = trader.principal / soldAtPrice;
    // let profitQuant = trader.quantity - principalQuant;
    CBP.makeCoinbaseSell(trader.asset + "/USD", trader.quantity)
    // CBP.makeCoinbaseSellWithProfit(trader.asset, [principalQuant, profitQuant])
        .then(() => {
            let id = trader.id;
            let quantity = trader.quantity;
            let purchasePrice = trader.purchasePrice;
            let purchaseAmnt = quantity * purchasePrice;
            let sellAmnt = trader.quantity * soldAtPrice;
            let profit = sellAmnt - purchaseAmnt;
            let purchaseDate = new Date(trader.date);
            let purchaseUnix = purchaseDate.getTime();
            let duration = Date.now() - purchaseUnix;
            duration = (duration / 1000 / 60 / 60 / 24).toFixed(1);
            SEND_SMS(`${id} (${trader.asset}, $${purchaseAmnt}, ${duration} hrs) sold ${quantity.toFixed(4)} @ $${soldAtPrice}\nPurchase price was ${trader.purchasePrice} for $${profit.toFixed(2)} profit`);
            LiquidatedTrader.insertMany(trader).then(() => Trader.findOneAndRemove({ id: trader.id }).catch(e => console.log(e)));
            let newSale = new Sale({
                id: idGenerator(),
                traderId: trader.id,
                asset: trader.asset,
                quantity: trader.quantity,
                purchasePrice: trader.purchasePrice,
                profitTarget: trader.profitTarget,
                strat: trader.strat || "N/A",
                sellPrice: soldAtPrice,
                botBuy: trader.botBuy,
                profit,
                duration
            })
            newSale.save();
        })
        .catch(async err => {
            console.log(`ERROR MAKING SALE, id: ${trader.id}, attempted soldAtPrice: ${soldAtPrice}, attempted quantity: ${trader.quantity}`, JSON.stringify(err))
            switch (err.name) {
                case "InsufficientFunds":
                    let deleteBool = await confirmInsuficientFunds(trader)
                    console.log(`ERROR: Trader ${trader.id} quantify exceeds coinbase ${trader.asset} asset balance of ${deleteBool}`) //deleteBool is returned as false if not to be deleted or as the quantity of asset remaining if should be deleted
                    console.log(deleteBool)
                    if (deleteBool) {
                        let deleted = await forceLiquidateTrader(trader, false, deleteBool);
                        !!deleted ? SEND_SMS((`ERROR: Trader ${trader.id} quantify exceeded coinbase ${trader.asset} asset balance \n\nSOLD OFF AND LIQUIDATED`)) : console.log(`error selling and deleting trader ${trader.id}`)
                    }
                    break;
                default: console.log("Automatic sell error handling capabilities out of scope")
            } 
        })
    
};

const runAllTraders = async () => {
    let traders = await Trader.find({});
    let prices = {};
    let unix = Date.now();
    
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
        };

        let age = ((unix - trader.unix) / 1000 / 60 / 60).toFixed(2);
        let proximity = currentPrice / trader.sellPrice;
        Trader.findOneAndUpdate({ id: trader.id }, { $set: { currentPrice, proximity, age }}).catch(() => {});
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
};

const reactivateLiquidatedTrader = async (id) => {
    let liquidatedTrader = await LiquidatedTrader.find({ id });
    Trader.insertMany(liquidatedTrader[0]).then(() => LiquidatedTrader.findOneAndRemove({ id }).catch(e => console.log(e)));
};

const modifySales = async () => { //set up to clean up "duration" field of Sale
    let sales = await Sale.find({});
    for (const sale of sales) {
        let saleUnix = new Date(sale.date).getTime();
        let trader = await LiquidatedTrader.findOne({ id: sale.traderId });
        let purchaseUnix = new Date(trader.date).getTime();
        let daysElapsed = parseFloat(((saleUnix - purchaseUnix) / 1000 / 60 / 60 / 24).toFixed(1));
        console.log(daysElapsed);
        sale.updateOne({$set: {duration: daysElapsed}}).catch(e=>console.log(e));
    }
};

const dynamicModifyTradersFunction = async () => {
    let traders = await Trader.find({});

    let lockedPrinciple = 0;
    let liquidPrinciple = 0;
    for (const trader of traders) {
        if (!!trader.sellPriceAdjust.length > 0) {
            // console.log(trader)
            let profitTarget = trader.profitTarget || 1.05;
            let newSellPrice = trader.purchasePrice * profitTarget;
            console.log(trader.sellPrice, trader.currentPrice);
            lockedPrinciple = lockedPrinciple + trader.purchasePrice * trader.quantity
            liquidPrinciple = liquidPrinciple + trader.currentPrice * trader.quantity
            // trader.updateOne({ $set: { sellPrice: newSellPrice } }).then(res=>console.log(res)).catch(err=>console.log(err));
        }
        // trader.updateOne({ $unset: { proximityHistory: "" } }).then(res=>console.log(res)).catch(e=>console.log(e));
    };
    console.log(lockedPrinciple, liquidPrinciple, lockedPrinciple - liquidPrinciple);
};

// deleteTrader("KC4y5aqBFLt");


// reactivateLiquidatedTrader("krGbWxyfiyO6");
// modifySales()
// modifyTraders();

module.exports = { makeNewTrader, runAllTraders, analyzeAssetsAndBuy };