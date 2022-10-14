require('dotenv').config();
const ccxt = require('ccxt');
const axios = require('axios');
const { CREATE_LOOP, idGenerator } = require('../util');

let coinbasepro = new ccxt.coinbasepro({
    password: process.env.CBP3_PASS,
    apiKey: process.env.CBP3_KEY,
    secret: process.env.CBP3_SECRET
});

const checkCoinbaseFunds = async () => {
    let funds = await coinbasepro.fetchTotalBalance();
    console.log(funds)
    return funds;
}

const getCoinbaseBalances = async (symbol) => {
    let balance = await coinbasepro.fetchBalance()
    console.log(symbol ? balance.total[symbol] : balance.total)
    return balance;
}

const makeCoinbaseBuy = async (asset, quantity) => {
    let buyOrder = await coinbasepro.createOrder(asset, "market", "buy", quantity)
    console.log(buyOrder)
    return buyOrder;
}

const makeCoinbaseSell = async (asset, quantity) => {
    let sellOrder = await coinbasepro.createOrder(asset, "market", "sell", quantity)
    console.log(sellOrder)
}

const checkMarketPrice = async (ticker) => {
    const price = await coinbasepro.fetchTicker(ticker)
    console.log(price.info.price);
    return price.info.price;
}

const run = async () => {
    const results = await Promise.all([
        axios.get('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd'),
        // axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd')
    ])
    let balance = await getCoinbaseBalances("ADA");
    if (balance.total["BTC"] < 0.0025) {
        await makeCoinbaseBuy("ADA/USD", 5)
        getCoinbaseBalances("ADA")
    }
}

const describeCcxtExchanges = () => {
    // console.log(coinbase.describe().has)
    // console.log(ccxt.exchanges);
    let CCXT_CLASSES = Object.keys(ccxt);
    let exchanges = ccxt.exchanges;

    CCXT_CLASSES.forEach(clas => {
        if (exchanges.includes(clas)) {
            // ccxt.coinbase.describe()
            let newExch = new ccxt[clas];
            let hasObj = newExch.describe().has;
            let hasBool = hasObj.createOrder;
            console.log(clas, hasBool)
            // console.log(new ccxt[clas].describe())
        }
    })
}

const ethereum = async () => {
    let balance = await getCoinbaseBalances("ETH");
    let price = await checkMarketPrice("ETH/USD");
    // if (price < 1300) {
    //     makeCoinbaseBuy("ETH/USD", 0.005)
    // }
    if (price > 1330) {
        makeCoinbaseSell("ETH/USD", balance)
    }
}

// coinbasepro.loadMarkets()
//     .then(res => console.log(res["ADA/USDT"]))
// getCoinbaseBalances()
// checkCoinbaseFunds()
// run()
// ethereum()

// CREATE_LOOP(ethereum, 0.5);
// checkMarketPrice('DOGE/USD');
// MakeNewTraderInstance("ETH", 0.01)

// makeCoinbaseSell("ETH/USD", .01)
// makeCoinbaseBuy("ETH/USD", 0.01);
// console.log(Date())

module.exports = { ethereum, checkMarketPrice, getCoinbaseBalances, makeCoinbaseBuy, makeCoinbaseSell, checkCoinbaseFunds }