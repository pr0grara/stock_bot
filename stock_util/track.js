const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.SECRET_KEY
});
const Snapshot = require('../models/Snapshot');

const fetchPrices = async (id) => {
    let tickers = await binance.futuresPrices();
    let newSnapShot = new Snapshot({
        id: id || null,
        date: Date(),
        tickers,
    })

    return newSnapShot.save()
        .then(() => tickers)
        .catch(err => err);
}

const CREATE_FETCH_LOOP = (min, id=0) => {
    fetchPrices(id)
    setTimeout(() => {
        id = id + 1
        CREATE_FETCH_LOOP(min, id)
    }, 1000 * 60 * min)
};

module.exports = { fetchPrices, CREATE_FETCH_LOOP };