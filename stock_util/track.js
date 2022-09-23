const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.SECRET_KEY
});
const Snapshot = require('../models/Snapshot');

const fetchPrices = async () => {
    let tickers = await binance.futuresPrices();
    let newSnapShot = new Snapshot({
        tickers
    })

    return newSnapShot.save()
        .then(() => tickers)
        .catch(err => err);
}

module.exports = { fetchPrices };