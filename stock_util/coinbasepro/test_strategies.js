const { checkForBuyPositions, generateAssetData, generatePerformance } = require('./analyze');
const { STRAT_1, STRAT_2, STRAT_3 } = require('./strategies');

const product_ids = [
    'LTC-USD',
    'DOGE-USD',
    'BTC-USD',
    'ETH-USD',
    'ADA-USD',
    'REP-USD',
    'XTZ-USD',
    'COMP-USD',
    'ORCA-USD',
    'MANA-USD',
    'DASH-USD',
    'PERP-USD',
    'DOT-USD',
    'KNC-USD',
    'AVAX-USD',
    'SHIB-USD',
    'XLM-USD',
    'AAVE-USD',
    'ETC-USD',
    'ZEC-USD'
];

var testParams = {
    product_ids: ["AVAX-USD", "MANA-USD"],
    // marketAverages: {},
    // latestTrader: {},
    // profitTarget: false
}

const generateMarketAverages = async (product_ids) => {
    let avgMeanOne = 0;
    let avgMeanThree = 0;
    let avgMeanTwelve = 0;
    let avgMeanSeventyFive = 0;
    let avgLowOne = 0;
    let avgLowThree = 0;
    let avgLowTwelve = 0;
    let avgLowSeventyFive = 0;
    let assetsData = {};

    for (const product_id of product_ids) {
        let t0 = Date.now();
        let data = await generateAssetData(product_id);
        let t1 = Date.now();
        console.log(`${product_id} data generated in ${(t1 - t0)/1000} sec`)
        
        assetsData[product_id] = data;
        let performance = generatePerformance(data); //generatePerformance() called TWICE
        let t2 = Date.now();
        console.log(`${product_id} performance generated in ${(t2-t1)} ms`)

        let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive, meanOne, lowOne] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive, performance.proxToMean.one, performance.proxToLow.one];
        avgMeanOne = avgMeanOne + meanOne;
        avgMeanThree = avgMeanThree + meanThree;
        avgMeanTwelve = avgMeanTwelve + meanTwelve;
        avgMeanSeventyFive = avgMeanSeventyFive + meanSeventyFive;
        avgLowOne = avgLowOne + lowOne;
        avgLowThree = avgLowThree + lowThree;
        avgLowTwelve = avgLowTwelve + lowTwelve;
        avgLowSeventyFive = avgLowSeventyFive + lowSeventyFive;
    }
    avgMeanOne = avgMeanOne / product_ids.length;
    avgMeanThree = avgMeanThree / product_ids.length;
    avgMeanTwelve = avgMeanTwelve / product_ids.length;
    avgMeanSeventyFive = avgMeanSeventyFive / product_ids.length;
    avgLowOne = avgLowOne / product_ids.length;
    avgLowThree = avgLowThree / product_ids.length;
    avgLowTwelve = avgLowTwelve / product_ids.length;
    avgLowSeventyFive = avgLowSeventyFive / product_ids.length;
    let marketAverages = { avgMeanOne, avgMeanThree, avgMeanTwelve, avgMeanSeventyFive, avgLowOne, avgLowThree, avgLowTwelve, avgLowSeventyFive };
    return [marketAverages, assetsData];
}

const simulate_checkForBuyPositions = async () => {
    let t0 = Date.now();
    console.log('checking for buy positions')

    // let product_ids = await grab_all_product_ids();
    let t1 = Date.now();
    console.log(`grabbed ids in ${(t1 - t0) / 1000} sec`)
    let results = await generateMarketAverages(product_ids);
    let [marketAverages, assetsData] = [results[0], results[1]];
    let t2 = Date.now();
    console.log(`Gross Data generated in ${(t2 - t1) / 1000} sec`)
    let positions = [];

    let t3 = Date.now()
    for (const product_id of product_ids) {
        console.log(`BEGIN ${product_id}`)
        let product_positions = [];
        let data = assetsData[product_id];
        let currentPrice = data.currentPrice;
        let performance = generatePerformance(data); //generatePerformance() called TWICE
        let buyParams = { "asset": product_id.split('-')[0], "usd": 20 };

        let lastTraderOfSameAsset;

        const STRATS = [STRAT_1, STRAT_2, STRAT_3]

        STRATS.forEach((STRAT, idx) => {
            let profitTarget = STRAT(performance, marketAverages, lastTraderOfSameAsset, currentPrice);
            if (!!profitTarget) {
                buyParams["profitTarget"] = profitTarget;
                buyParams["strat"] = `STRAT_${idx + 1}`;
                product_positions.push(Object.assign({}, buyParams));
            }
        });

        let topPos;
        // product_positions = product_positions.filter(pos => !!pos.profitTarget)
        if (product_positions.length === 1) {
            topPos = product_positions[0];
        } else if (product_positions.length > 1) {
            topPos = product_positions.shift();
            product_positions.forEach(pos => {
                if (pos.profitTarget > topPos.profitTarget) topPos = pos;
            })
        }

        console.log(`top pos for ${product_id}`, topPos)
        // if (topPos) positions.push(topPos);
        if (product_positions.length > 0) positions.push(...product_positions)
        let t4 = Date.now();
        console.log(`${product_id} checked in ${(t4 - t3)} ms`);
    };

    let t5 = Date.now();
    console.log(`All buy positions checked in ${(t5 - t0) / 1000} sec`)
    if (positions.length > 0) return positions;
    console.log('No buys found');
    return false;
};

// simulate_checkForBuyPositions().then(res => console.log(res));

// checkForBuyPositions().then(res => console.log(res))
// checkForBuyPositions(testParams).then(res => console.log(res))

// if (product_id === "ETH-USD" ||
        //     product_id === "BTC-USD" ||
        //     product_id === "MANA-USD" ||
        //     product_id === "DOGE-USD" ||
        //     product_id === "COMP-USD" ||
        //     product_id === "XTZ-USD" ||
        //     product_id === "LTC-USD" ||
        //     product_id === "REP-USD" ||
        //     product_id === "MKR-USD") {
        // if (product_id) {
        //     let profitTarget = STRAT_1(performance, marketAverages, lastTraderOfSameAsset, currentPrice);
        //     buyParams["profitTarget"] = profitTarget;
        //     buyParams["strat"] = "STRAT_1";
        //     if (!!profitTarget) product_positions.push(buyParams);
        // };

        // if (product_id === "DASH-USD" ||
        //     product_id === "DOT-USD" ||
        //     product_id === "KNC-USD" ||
        //     product_id === "ADA-USD" ||
        //     product_id === "PERP-USD" ||
        //     product_id === "ORCA-USD" ||
        //     product_id === "SHIB-USD" ||
        //     product_id === "AVAX-USD" ||
        //     product_id === "ETC-USD" ||
        //     product_id === "AAVE-USD") {
        // if (product_id) {
        //     let profitTarget = STRAT_2(performance, marketAverages, lastTraderOfSameAsset, currentPrice);
        //     buyParams["profitTarget"] = profitTarget;
        //     buyParams["strat"] = "STRAT_2";
        //     if (!!profitTarget) product_positions.push(buyParams);
        // };

        // if (product_id) {
        //     let profitTarget = STRAT_3(performance, marketAverages, lastTraderOfSameAsset, currentPrice);
        //     buyParams["profitTarget"] = profitTarget;
        //     buyParams["strat"] = "STRAT_3";
        //     if (profitTarget) continue;
        //     if (profitTarget > 1.022) product_positions.push(buyParams);
        // };