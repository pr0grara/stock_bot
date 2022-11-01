// const { generateMarketAverages, generatePerformance, grab_all_assets, grab_all_product_ids, findLatestTrader } = require('./analyze');

const generateComparatives = (performance, marketAverages) => {
    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];        
    let comparative3Mean = meanThree / marketAverages.avgMeanThree;
    let comparative12Mean = meanTwelve / marketAverages.avgMeanTwelve;
    let comparative75Mean = meanSeventyFive / marketAverages.avgMeanSeventyFive;
    let comparative3Low = lowThree / marketAverages.avgLowThree;
    let comparative12Low = lowTwelve / marketAverages.avgLowTwelve;
    let comparative75Low = lowSeventyFive / marketAverages.avgLowSeventyFive;
    return [ comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low ]
};

const initialCheck = (lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };
    return true;
};

const generateAllVals = (performance, marketAverages) => {
    let comparatives = generateComparatives(performance, marketAverages);
    return [
        performance.proxToMean.three, 
        performance.proxToMean.twelve, 
        performance.proxToMean.seventyFive, 
        performance.proxToMean.threeHundred,
        performance.proxToLow.three, 
        performance.proxToLow.twelve, 
        performance.proxToLow.seventyFive,
        performance.proxToLow.threeHundred,
        ...comparatives
    ];
};

const STRAT_1 = (performance, marketAverages, lastTrader, currentPrice) => { 
    if (!initialCheck(lastTrader, currentPrice)) return false;
    let [meanThree, meanTwelve, meanSeventyFive, meanThreeHundred, lowThree, lowTwelve, lowSeventyFive, lowThreeHundred, comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateAllVals(performance, marketAverages)

    if (meanThree < 0.978) return ((1 - meanThree) + 1) * 1.05;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1- meanTwelve) + 1) * 1.05;
    return false;
};

const STRAT_2 = (performance, marketAverages, lastTrader, currentPrice) => {
    if (!initialCheck(lastTrader, currentPrice)) return false;
    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive, comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateAllVals(performance, marketAverages)

    if (lowThree < 1.005) { //filter for assets who are only MAX 0.5% higher than 3 day low
        if (meanTwelve < 0.965) {//filter for assets whose price is MIN 5% down of 12 day mean 
            return ((1 - meanTwelve) + 1) * 1.05;
        };
    };
    if (meanThree < 0.965 && meanTwelve < 0.975) return ((1 - meanThree) + 1) * 1.05;
    return false;
};

const STRAT_3 = (performance, marketAverages, lastTrader, currentPrice) => {
    if (!initialCheck(lastTrader, currentPrice)) return false;
    let [meanThree, meanTwelve, meanSeventyFive, meanThreeHundred, lowThree, lowTwelve, lowSeventyFive, lowThreeHundred, comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateAllVals(performance, marketAverages)

    if (comparative12Mean < 0.95 && meanTwelve < 0.99) return (1 - ((comparative12Mean + meanTwelve) / 2) + 1);
    return false;
}

const ETH_STRAT = (performance, marketAverages, lastTrader, currentPrice) => { 
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];        
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1- meanTwelve) + 1) * 1.05;
    return false;
};

const ADA_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const MANA_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const COMP_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const DOGE_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const SHIB_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const XTZ_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const LTC_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const REP_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const ORCA_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const DASH_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const PERP_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const DOT_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const AVAX_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

const XLM_STRAT = (performance, marketAverages, lastTrader, currentPrice) => {
    if (lastTrader) {
        let hoursSinceLastTrade = (Date.now() - lastTrader.unix) / 1000 / 60 / 60;
        let priceDelta = currentPrice / lastTrader.purchasePrice;
        console.log(hoursSinceLastTrade, priceDelta)
        if ((!!lastTrader) && (hoursSinceLastTrade < 2)) return false;
        if (priceDelta > 0.98 || hoursSinceLastTrade < 48) return false;
    };

    let [meanThree, meanTwelve, meanSeventyFive, lowThree, lowTwelve, lowSeventyFive] = [performance.proxToMean.three, performance.proxToMean.twelve, performance.proxToMean.seventyFive, performance.proxToLow.three, performance.proxToLow.twelve, performance.proxToLow.seventyFive];
    let [comparative3Mean, comparative12Mean, comparative75Mean, comparative3Low, comparative12Low, comparative75Low] = generateComparatives(performance, marketAverages);

    if (meanThree < 0.975) return (1 - meanThree) + 1;
    if (lowThree < 1.005 && meanTwelve < 0.975) return ((1 - meanTwelve) + 1) * 1.05;
    return false;
};

// const run = async (product_id) => {
//     let product_ids = await grab_all_product_ids();
//     let results = await generateMarketAverages(product_ids);
//     let [marketAverages, assetsData] = [results[0], results[1]];
//     let lastTrader = await findLatestTrader(product_id);
//     let data = assetsData[product_id];
//     let currentPrice = data.currentPrice;
//     let performance = generatePerformance(data);
//     BTC_STRAT(performance, marketAverages, lastTrader, currentPrice).then(res => console.log(res));
// };

// generateComprehensiveAnalysis();
// run("BTC-USD");

module.exports = { STRAT_1, STRAT_2, STRAT_3 }