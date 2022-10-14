const Snapshot = require('../models/Snapshot');
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.SECRET_KEY
});

const grabSnaps = async () => {
    console.log('hello')
    let snaps = await Snapshot.find({})
    return snaps;
}

const prepTickers = async (ticker) => {
    let snaps = await grabSnaps();
    let tickers = {};
    snaps.forEach(snap => {
        if (!!ticker) {
            tickers[snap.id] = snap.tickers[ticker]
        } else {
            tickers[snap.id] = snap.tickers;
        }
    });
    console.log(tickers)
    return tickers;
}

const filter = (filter, snaps) => {
    // let ids = snaps.map(snap => snap.id);
    
    // switch(filter) {
    //     case "START_DATE":
    //     default:
    //         break;
    // }
}

const filterSnaps = (params, snaps) => {
    params.forEach(param => {
        filter(param, snaps)
    })
}

const grabHistoricalData = async (startDate, endDate) => {
    let ticker = await binance.prices();
    console.info(`Price of BNB: ${ticker.BNBUSDT}`);
    console.info(await binance.futuresAccount());
}

grabHistoricalData()

module.exports = { grabSnaps, grabHistoricalData };