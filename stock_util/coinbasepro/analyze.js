require('dotenv').config();
const axios = require('axios');
const Analysis = require('../../models/Analysis');
const Trader = require('../../models/Trader');
const Asset = require('../../models/Asset');
const ccxt = require('ccxt');
const product_ids = require('../../docs/cb_product_id.json');
const { checkMarketPrice, checkCoinbaseFunds } = require('../../ccxt/coinbasepro');
const { idGenerator, SEND_SMS } = require('../../util');
const coinbasepro = new ccxt.coinbasepro({
    password: process.env.CBP3_PASS,
    apiKey: process.env.CBP3_KEY,
    secret: process.env.CBP3_SECRET
});

const grabCandleData = async (product_id, granularity) => {
    let candles = await axios.get(`https://api.exchange.coinbase.com/products/${product_id}/candles?granularity=${granularity || 900}`);//granularity of 900 means candle lengths are 15min, with 300 candles representing data for last 3.125 days
    candles = candles.data;
    let prices = {};
    let pricesArr = candles.map(candle => parseFloat(((candle[1] + candle[2]) / 2)));
    let low = { price: pricesArr[0], candle: 0 };
    let high = { price: 0, candle: 0 };
    let mean = 0
    pricesArr.forEach((price, idx) => {
        mean = mean + price;
        if (price < low.price) {
            low.price = price;
            low.candle = idx;
        }
        if (price > high.price) {
            high.price = price;
            high.candle = idx;
        }
    })
    mean = mean / pricesArr.length;
    prices["prices"] = pricesArr;
    prices["mean"] = mean;
    prices["low"] = low;
    prices["high"] = high;
    prices["granularity"] = granularity || 900;
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
        // prices: historicalPrices["prices"],
        time: Date.now()
    };
    // let newAnalysis = new Analysis({
    //     id: idGenerator(),
    //     product_id,
    //     percent,
    //     delta,
    //     currentPrice,
    //     time: Date.now()
    // })
    // newAnalysis.save().catch(err => console.log(err));
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

const analyzeAllAssets = async () => {
    let report = [];
    for (const product_id of product_ids) {
        let analysis = await analyze(product_id);
        let bool = await buyBool(analysis);
        if (bool === true) report.push(analysis);
    }
    console.log(JSON.stringify(report))
};

const generateAges = (traders, unix) => {
    let ages = {};
    for (const trader of traders) {
        let hoursElapsed = parseFloat(((unix - trader.unix) / 1000 / 60 / 60).toFixed(2));
        ages[trader.id] = hoursElapsed;
    };
    return ages;
};

const generateAssetsObj = async (assets) => {
    let assetsObj = {};
    for (const asset of assets) {
        let currentPrice = await checkMarketPrice(asset + "/USD");
        assetsObj[asset] = parseFloat(currentPrice);
    }
    return assetsObj;
}

const reviewTradersSellTargets = async () => {
    let unix = Date.now();
    let traders = await Trader.find({});
    let tradersObj = {};
    let assets = {};
    traders.forEach(trader => {
        tradersObj[trader.id] = trader
        assets[trader.asset] = true;
    });
    assets = Object.keys(assets);
    assets = await generateAssetsObj(assets);

    let ages = generateAges(traders, unix)
    let ids = Object.keys(ages);

    for (const id of ids) {
        let traderAsset = tradersObj[id].asset;
        let traderAge = ages[id];
        let buyPrice = tradersObj[id].purchasePrice;
        let currentPrice = assets[traderAsset];
        let proximity = currentPrice / buyPrice;
        let proximityHistory = tradersObj[id].proximityHistory || {};
        proximityHistory[unix] = proximity;
        Trader.findOneAndUpdate({ id }, { $set: { proximityHistory } }).catch(err => console.log(err));
        if (traderAge < 24) continue  //trader must be at least 1 day old before sell target increase
        let sellPriceAdjust = tradersObj[id].sellPriceAdjust;
        let lastTargetAdjust = sellPriceAdjust[sellPriceAdjust.length - 1];
        if (!!lastTargetAdjust && ((unix - lastTargetAdjust) / 1000 / 60 / 60) < 48) continue; //only 1 price adjust per 48 hours
        if (proximity < 0.97) {
            let targetIncreaseRate = ((1 - proximity)) / 4; //for every percent below purchase price asset drops we increase sell target by 0.25%
            let targetIncrease = buyPrice * targetIncreaseRate;
            Trader.findOneAndUpdate({ id }, { $push: { sellPriceAdjust: unix }, $inc: { sellPrice: (targetIncrease) }})
                .then(() => SEND_SMS(`trader ${id} (${traderAsset}) is ${proximity.toFixed(4)} purchase price, has been active for ${traderAge} hours and has therefore had its sell target increased by $${targetIncrease.toFixed(10)} (${(targetIncreaseRate * 100).toFixed(6)}%)`))
                .catch(err => console.log(err));
        }
        
    }
}

const generateAssetData = async (product_id) => {
    let granularities = [900, 3600, 21600];
    let ticker = await grabTickerData(product_id);
    let currentPrice = parseFloat(ticker.price);
    let threeDayMean = 0;
    let threeDayLow = 0;
    let threeDayHigh = 0;
    let twelveDayMean = 0;
    let twelveDayLow = 0;
    let twelveDayHigh = 0;
    let seventyFiveDayMean = 0;
    let seventyFiveDayLow = 0;
    let seventyFiveDayHigh = 0;

    for (const granularity of granularities) {
        let prices = await grabCandleData(product_id, granularity); //60 300 900 3600 21600 86400
        // console.log(prices)
        switch (granularity) {
            case 900:
                threeDayMean = prices.mean;
                threeDayLow = prices.low.price;
                threeDayHigh = prices.high.price;
                break
            case 3600:
                twelveDayMean = prices.mean;
                twelveDayLow = prices.low.price;
                twelveDayHigh = prices.high.price;
                break
            case 21600:
                seventyFiveDayMean = prices.mean;
                seventyFiveDayLow = prices.low.price;
                seventyFiveDayHigh = prices.high.price;
                break
            default:
                console.log('granularities messed up')
                break;
        };
    };


    return { currentPrice, threeDayMean, threeDayLow, threeDayHigh, twelveDayMean, twelveDayLow, twelveDayHigh, seventyFiveDayMean, seventyFiveDayLow, seventyFiveDayHigh }
}

const generatePerformance = (data) => {
    var proximity = (target) => {
        return currentPrice / target;
    }

    let [currentPrice, threeDayMean, twelveDayMean, seventyFiveDayMean, threeDayLow, threeDayHigh, twelveDayLow, twelveDayHigh, seventyFiveDayLow, seventyFiveDayHigh] = [data.currentPrice, data.threeDayMean, data.twelveDayMean, data.seventyFiveDayMean, data.threeDayLow, data.threeDayHigh, data.twelveDayLow, data.twelveDayHigh, data.seventyFiveDayLow, data.seventyFiveDayHigh];
    let performance;

    let proxToMean = {
        three: proximity(threeDayMean),
        twelve: proximity(twelveDayMean),
        seventyFive: proximity(seventyFiveDayMean)
    };
    let proxToLow = {
        three: proximity(threeDayLow),
        twelve: proximity(twelveDayLow),
        seventyFive: proximity(seventyFiveDayLow)
    };

    performance = { proxToMean, proxToLow };
    return performance;
}

const updateAsset = async product_id => {
    let data = await generateAssetData(product_id);
    let [currentPrice, threeDayMean, twelveDayMean, seventyFiveDayMean, threeDayLow, threeDayHigh, twelveDayLow, twelveDayHigh, seventyFiveDayLow, seventyFiveDayHigh] = [data.currentPrice, data.threeDayMean, data.twelveDayMean, data.seventyFiveDayMean, data.threeDayLow, data.threeDayHigh, data.twelveDayLow, data.twelveDayHigh, data.seventyFiveDayLow, data.seventyFiveDayHigh]
    let unix = Date.now();
    let asset = await Asset.findOne({ product_id });
    
    let history = asset.history;
    history[unix] = { currentPrice, threeDayMean, threeDayLow, threeDayHigh, twelveDayMean, twelveDayLow, twelveDayHigh, seventyFiveDayMean, seventyFiveDayLow, seventyFiveDayHigh }
    
    let performance = generatePerformance(data);

    // console.log(currentPrice, threeDayMean, twelveDayMean, seventyFiveDayMean ,performance);


    Asset.findOneAndUpdate({ product_id }, {
        $set: { history, performance, "lastPrice": currentPrice, threeDayMean, twelveDayMean, seventyFiveDayMean, threeDayLow, threeDayHigh, twelveDayLow, twelveDayHigh, seventyFiveDayLow, seventyFiveDayHigh } 
    }).catch(err => console.log(err));

}

const grab_all_product_ids = async () => {
    // let product_ids = ["ETH-USD", "BTC-USD", "ADA-USD", "DOGE-USD", "LTC-USD", "ORCA-USD", "REP-USD", "COMP-USD", "XTZ-USD", "MANA-USD", "DASH-USD", "PERP-USD"];
    let assets = await Asset.find({});
    let product_ids = assets.map(asset => asset.product_id);
    return product_ids;
}

const updateAllAssets = async () => {
    let product_ids = await grab_all_product_ids();
    // console.log(product_ids)
    for (const product_id of product_ids) {
        await updateAsset(product_id);
    };
};

const createAsset = async (ticker) => {
    let product_id = ticker + "-USD"
    let data = await generateAssetData(product_id);
    let [ lastPrice, threeDayMean, twelveDayMean, seventyFiveDayMean, threeDayLow, threeDayHigh, twelveDayLow, twelveDayHigh, seventyFiveDayLow, seventyFiveDayHigh ] = [data.currentPrice, data.threeDayMean, data.twelveDayMean, data.seventyFiveDayMean, data.threeDayLow, data.threeDayHigh, data.twelveDayLow, data.twelveDayHigh, data.seventyFiveDayLow, data.seventyFiveDayHigh]
    // console.log(lastPrice, threeDayMean, threeDayLow, threeDayHigh, twelveDayMean, seventyFiveDayMean)
    let unix = Date.now();
    
    let history = {};
    history[unix] = { "currentPrice": lastPrice, threeDayMean, threeDayLow, threeDayHigh, twelveDayMean, twelveDayLow, twelveDayHigh, seventyFiveDayMean, seventyFiveDayLow, seventyFiveDayHigh }

    let performance = generatePerformance(data);

    let newAsset = new Asset({
        ticker,
        product_id,
        lastPrice,
        history,
        performance,
        threeDayMean,
        threeDayLow,
        threeDayHigh,
        twelveDayMean, 
        twelveDayLow,
        twelveDayHigh,
        seventyFiveDayMean,
        seventyFiveDayLow, 
        seventyFiveDayHigh,
        unix
    })

    newAsset.save().catch(err => console.log(err));
};

const createAllAssets = () => {
    let tickers = ["ORCA", "REP", "COMP", "XTZ", "MANA"];
    for (const ticker of tickers) {
        createAsset(ticker);
    };
};

const deleteAsset = (product_id) => {
    Asset.findOneAndDelete({ product_id }).catch(err => console.log(err));
}

const generateMarketAverages = async (product_ids) => {
    let avgMeanThree = 0;
    let avgMeanTwelve = 0;
    let avgMeanSeventyFive = 0;
    let avgLowThree = 0;
    let avgLowTwelve = 0;
    let avgLowSeventyFive = 0;
    let assetsData = {};

    for (const product_id of product_ids) {
        let data = await generateAssetData(product_id);
        assetsData[product_id] = data;
        // let [currentPrice, threeDayMean, twelveDayMean, seventyFiveDayMean, threeDayLow, threeDayHigh, twelveDayLow, twelveDayHigh, seventyFiveDayLow, seventyFiveDayHigh] = [data.currentPrice, data.threeDayMean, data.twelveDayMean, data.seventyFiveDayMean, data.threeDayLow, data.threeDayHigh, data.twelveDayLow, data.twelveDayHigh, data.seventyFiveDayLow, data.seventyFiveDayHigh]
        let performance = generatePerformance(data);
        let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
        avgMeanThree = avgMeanThree + meanThree;
        avgMeanTwelve = avgMeanTwelve + meanTwelve;
        avgMeanSeventyFive = avgMeanSeventyFive + meanSeventyFive;
        avgLowThree = avgLowThree + lowThree;
        avgLowTwelve = avgLowTwelve + lowTwelve;
        avgLowSeventyFive = avgLowSeventyFive + lowSeventyFive;
    }
    avgMeanThree = avgMeanThree / product_ids.length;
    avgMeanTwelve = avgMeanTwelve / product_ids.length;
    avgMeanSeventyFive = avgMeanSeventyFive / product_ids.length;
    avgLowThree = avgLowThree / product_ids.length;
    avgLowTwelve = avgLowTwelve / product_ids.length;
    avgLowSeventyFive = avgLowSeventyFive / product_ids.length;
    let marketAverages = { avgMeanThree, avgMeanTwelve, avgMeanSeventyFive, avgLowThree, avgLowTwelve, avgLowSeventyFive };
    return [marketAverages, assetsData];
}

const findLatestTrader = async (product_id, longBool) => {
    let ticker = product_id.split('-')[0];
    let traders = await Trader.find();
    traders = traders.filter(trader => trader.asset === ticker);

    let newestTrader = traders.shift();

    traders.forEach(trader => {
        if (longBool) {
            if ((trader.longPosition === longBool) && (trader.unix >= newestTrader.unix)) newestTrader = trader;
        } else {
            if (trader.unix >= newestTrader.unix) newestTrader = trader;
        }
    });

    return newestTrader
}

const checkForBuyPositions = async () => {
    console.log('checking for buy positions')
    let product_ids = await grab_all_product_ids();
    let results = await generateMarketAverages(product_ids);
    let [marketAverages, assetsData] = [results[0], results[1]];
    let longPositions = [];
    let shortPositions = [];
    
    for (const product_id of product_ids) {
        let unix = Date.now()
        let data = assetsData[product_id];
        let currentPrice = data.currentPrice;
        let performance = generatePerformance(data);
        let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];        
        let comparative3Mean = meanThree / marketAverages.avgMeanThree;
        let comparative12Mean = meanTwelve / marketAverages.avgMeanTwelve;
        let comparative75Mean = meanSeventyFive / marketAverages.avgMeanSeventyFive;
        let comparative3Low = lowThree / marketAverages.avgLowThree;
        let comparative12Low = lowTwelve / marketAverages.avgLowTwelve;
        let comparative75Low = lowSeventyFive / marketAverages.avgLowSeventyFive;
        performance["comparativeMean"] = [comparative3Mean, comparative12Mean, comparative75Mean];
        performance["comparativeLow"] = [comparative3Low, comparative12Low, comparative75Low];
        let buyParams = { "asset": product_id.split('-')[0], "usd": 5 };
        let profitTarget = 0.022;

        //LONG
        if (meanTwelve < marketAverages.avgMeanTwelve) { //filter for assets performing below the average mean of their peers over ~12 days
            if (comparative12Mean < 0.92) { //filter for assets performing significantly poorly compared to the average mean over ~12 days
                if (meanSeventyFive < 0.9 && (meanSeventyFive < meanTwelve)) { //make sure assets 75 day mean is lower than assets 12 day mean to ensure good long
                    let lastTraderOfSameAsset = await findLatestTrader(product_id, true);
                    profitTarget = 1 - comparative12Mean;
                    profitTarget = 1 + profitTarget;
                    buyParams["profitTarget"] = profitTarget;
                    buyParams["longPosition"] = true;

                    let msSinceLastTrade = 0.0;
                    let hoursSinceLastTrade = 0.0;
                    let priceDelta = currentPrice / lastTraderOfSameAsset.purchasePrice;

                    try {
                        msSinceLastTrade = unix - lastTraderOfSameAsset.unix;
                        hoursSinceLastTrade = msSinceLastTrade / 1000 / 60 / 60;
                    } catch (e) { };

                    if (!lastTraderOfSameAsset) longPositions.push(buyParams);
                    if ((!!lastTraderOfSameAsset) && (hoursSinceLastTrade > 6)) {
                        if (priceDelta < 0.95 || hoursSinceLastTrade > 48) {
                            console.log(`all criteria for long positions strategy met for ${product_id.split('-')[0]}:`)
                            console.log("priceDelta:", priceDelta, "hoursSinceLastBuy:", hoursSinceLastTrade);
                            longPositions.push(buyParams);
                        }
                    };
                }
            }
        }

        //SHORT
        if (lowThree < 1.0075) { //filter for assets who are only MAX 0.75% higher than 3 day low
            if (meanTwelve < 0.92) {//filter for assets whose price is MIN 8% down of 12 day mean
                let lastTraderOfSameAsset = await findLatestTrader(product_id, false);
                profitTarget = 1 - meanTwelve; //meanTwelve is the expected value asset will return to shortly in this strat
                profitTarget = 1 + profitTarget;
                profitTarget = profitTarget * 0.99; //since these are short positions we want to curb profitTarget slightly
                //even a 1% decrease is significant here i.e. 1.035 initial profitTarget (min possible value) * 0.99 = 1.025 adjusted profitTarget
                buyParams["profitTarget"] = profitTarget;
                buyParams["longPosition"] = false;
                let msSinceLastTrade = 0.0;
                let hoursSinceLastTrade = 0.0;
                let priceDelta = currentPrice / lastTraderOfSameAsset.purchasePrice;
                
                try {
                    msSinceLastTrade = unix - lastTraderOfSameAsset.unix;
                    hoursSinceLastTrade = msSinceLastTrade / 1000 / 60 / 60;
                } catch (e) { };

                if (!lastTraderOfSameAsset) shortPositions.push(buyParams);
                if ((!!lastTraderOfSameAsset) && (hoursSinceLastTrade > 6)) {
                    if (priceDelta < 0.95 || hoursSinceLastTrade > 48) {
                        console.log(`all criteria for short position strategy met for ${product_id.split('-')[0]}:`)
                        console.log("priceDelta:", priceDelta, "hoursSinceLastBuy:", hoursSinceLastTrade);
                        shortPositions.push(buyParams);
                    }
                };
            }
        }
    }

    if (shortPositions.length > 0 || longPositions.length > 0) return { shortPositions, longPositions };
    return false;
};

const buyPositions = async (makeNewTrader) => {
    let funds = await checkCoinbaseFunds();
    if (funds.USD < 100) return console.log(`buys canceled due to insifficient funds USD: $${funds.USD}. $100 min.`);
    let positions = await checkForBuyPositions()
    if (!positions) return;
    let [shortPositions, longPositions] = [positions.shortPositions, positions.longPositions];
    for (const buyParams of longPositions) await makeNewTrader(buyParams, true);
    for (const buyParams of shortPositions) await makeNewTrader(buyParams, true);
};

// analyzeAllAssets()
// analyze("SHPING-USD").then(res => console.log(res))

// analyze("ETH-USD");

// createAsset("SHIB")
// createAllAssets()
// updateAllAssets()
// deleteAsset("AVAX-USD")
// checkForBuyPositions();
// buyPositions()
// findLatestTrader('BTC-USD').then(res => console.log(res))
// findLatestTrader('KNC-USD')
// testStrategy("KNC-USD")

module.exports = { analyze, buyBool, reviewTradersSellTargets, updateAllAssets, checkForBuyPositions, buyPositions };