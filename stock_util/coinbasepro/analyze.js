require('dotenv').config();
const axios = require('axios');
const Analysis = require('../../models/Analysis');
const ccxt = require('ccxt');
const { idGenerator } = require('../../util');
const coinbasepro = new ccxt.coinbasepro({
    password: process.env.CBP3_PASS,
    apiKey: process.env.CBP3_KEY,
    secret: process.env.CBP3_SECRET
});

const grabCandleData = async (product_id) => {
    let candles = await axios.get(`https://api.exchange.coinbase.com/products/${product_id}/candles?granularity=900`);//granularity of 900 means candle lengths are 15min, with 300 candles representing data for last 3.125 days
    candles = candles.data;
    let prices = {};
    let pricesArr = candles.map(candle => parseFloat(((candle[1] + candle[2]) / 2).toFixed(2)));
    let low = { price: pricesArr[0], minute: 0 };
    let high = { price: 0, minute: 0 };
    pricesArr.forEach((price, idx) => {
        if (price < low.price) {
            low.price = price;
            low.minute = idx;
        }
        if (price > high.price) {
            high.price = price;
            high.minute = idx;
        }
    })
    prices["prices"] = pricesArr;
    prices["low"] = low;
    prices["high"] = high;
    return prices;
};

const grabTickerData = async (product_id) => {
    let ticker = await axios.get(`https://api.exchange.coinbase.com/products/${product_id}/ticker`);
    ticker = ticker.data;
    return ticker;
};

const deltaScore = (lowDelta, highDelta) => {
    let range = ((lowDelta < 0) ? (lowDelta * -1) : lowDelta) + ((highDelta < 0) ? (highDelta * -1) : highDelta); //what is the spread between high and low deltas
    let lowScore = ((lowDelta < 0) ? (lowDelta * -1) : lowDelta) / range; //what percent of spread is made up of low
    let highScore = ((highDelta < 0) ? (highDelta * -1) : highDelta) / range; //what percent of spread is made up of high
    return { range, lowScore, highScore };
};

const deltaHighOrLow = (currentPrice, historicalPrices) => { //are we closer to the historical high or low?
    let lowRatio = historicalPrices.low.price / currentPrice; //how close are we currently to the lowest price in candle data?
    let highRatio = historicalPrices.high.price / currentPrice; //how close are we currently to the highest price in candle data?
    let lowDelta = 1 - lowRatio; //express delta as a percentage i.e. 1 - 0.95 = 0.05 which means current price is 5% UP from LOWEST price in candle data 
    let highDelta = 1 - highRatio; //i.e. 1 - 1.015 = -0.015 or price is DOWN 1.5% from HIGHEST price in candle data
    //ideally we want a negative lowDelta signifying that the price is below the historical low for candle time period
    // console.log(lowRatio, highRatio);
    // console.log(lowDelta, highDelta);
    let delta = {
        lowDelta,
        highDelta,
        scores: deltaScore(lowDelta, highDelta)
    }
    return delta;
}

const deltaPercent = (currentPrice, historicalPrices) => {
    let avgPrice = 0;
    historicalPrices.forEach(price => avgPrice = avgPrice + price);
    avgPrice = avgPrice / historicalPrices.length;
    let percent = currentPrice / avgPrice;
    percent = percent - 1; //0.01 would equate to 1% increase over the average price during the candle data
    return percent;
}


const analyze = async (product_id, currentPrice) => {
    let ticker 
    if (!currentPrice) {
        ticker = await grabTickerData(product_id);
        currentPrice = parseFloat(ticker.price);
        // currentPrice = 1208;
    }
    let historicalPrices = await grabCandleData(product_id);
    let percent = deltaPercent(currentPrice, historicalPrices.prices);
    let delta = deltaHighOrLow(currentPrice, historicalPrices);
    let analysis = {
        percent,
        delta,
        currentPrice,
        product_id,
        time: Date.now()
    };
    let newAnalysis = new Analysis({
        id: idGenerator(),
        product_id,
        percent,
        delta,
        currentPrice,
        time: Date.now()
    })
    newAnalysis.save().catch(err => console.log(err));
    return analysis;
}

const buyBool = async (analysis, product_id, currentPrice) => {
    // let analysis = await analyze(product_id, currentPrice);
    // console.log(analysis)
    if (analysis.percent > 0) return false; //if percent is up any percent from the average of historical data do not buy
    if (analysis.delta.highDelta > -0.0075) return false; //if price is not lower than 0.75% the highest price during historical data do not buy
    if (analysis.delta.lowDelta > 0.01) return false; //if price is higher than 1% the lowest price during historical data do not buy
    // if (analysis.delta.scores.lowScore) return false; 
    // if (analysis.delta.scores.highScore) return false; 
    return true; //if all checks pass then BUY
}

analyze("ETH-USD");

module.exports = { analyze, buyBool };