const { checkMarketPrice } = require("../ccxt/coinbasepro");
const { grabCandleData } = require("./coinbasepro/analyze");

const test = () => {
    checkMarketPrice('BTC/USD').then(res=>console.log(res))
    grabCandleData('BTC-USD').then(res=>console.log(res))
}

// test();