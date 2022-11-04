require('dotenv').config();
const ccxt = require('ccxt');
const axios = require('axios');

let coinbasepro = new ccxt.coinbasepro({
    password: process.env.CBP3_PASS,
    apiKey: process.env.CBP3_KEY,
    secret: process.env.CBP3_SECRET
});

const checkCoinbaseFunds = async () => {
    let funds = await coinbasepro.fetchTotalBalance();
    return funds;
}

const getCoinbaseBalances = async (symbol) => {
    let balance = await coinbasepro.fetchBalance()
    console.log(symbol ? balance.total[symbol] : balance.total)
    return balance;
}

const makeCoinbaseBuy = async (asset, quantity) => {
    let buyOrder = await coinbasepro.createOrder(asset, "market", "buy", quantity)
    return buyOrder;
}

const makeCoinbaseSell = async (asset, quantity) => {
    let sellOrder = await coinbasepro.createOrder(asset, "market", "sell", quantity)
    console.log(sellOrder)
}

const makeCoinbaseSellWithProfit = async (asset, quantities) => {
    let [principalQuant, profitQuant] = [...quantities];
    console.log(asset, principalQuant, profitQuant)
    await coinbasepro.createOrder(asset + "/USDT", "market", "sell", principalQuant);
    await coinbasepro.createOrder(asset + "/USD", "market", "sell", profitQuant);
    console.log(`sold ${principalQuant} of ${asset} (principal) into USDT and ${profitQuant} (profit) into USD`);
    return
};

const checkMarketPrice = async (ticker) => {
    const price = await coinbasepro.fetchTicker(ticker)
    return price.info.price;
}

const WITHDRAW_FUNDS = async (amount) => {
    const CODE = "USDT";
    const ADDRESS = process.env.TETHER_WITHDRAW_ADDRESS;
    coinbasepro.withdraw(CODE, amount, ADDRESS).then(res => console.log(res)).catch(e => console.log(e))
}

const describeCcxtExchanges = () => {
    let CCXT_CLASSES = Object.keys(ccxt);
    let exchanges = ccxt.exchanges;

    CCXT_CLASSES.forEach(clas => {
        if (exchanges.includes(clas)) {
            let newExch = new ccxt[clas];
            let hasObj = newExch.describe().has;
            let hasBool = hasObj.createOrder;
            console.log(clas, hasBool)
        }
    })
}

const test = async () => {
    let market = await coinbasepro.withdraw()
    // let account = await coinbasepro.account();
    console.log(market)
}

// test()
// makeCoinbaseSell("USDT/USD", 1)
// WITHDRAW_FUNDS(1);

module.exports = { checkMarketPrice, getCoinbaseBalances, makeCoinbaseBuy, makeCoinbaseSell, checkCoinbaseFunds, WITHDRAW_FUNDS, makeCoinbaseSellWithProfit }