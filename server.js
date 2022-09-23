require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const { CREATE_LOOP } = require('./util');
const {  fetchPrices } = require('./stock_util/track');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('connected to mongo'))
    .catch(() => console.log('error connecting to mongo'));

const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.SECRET_KEY
});

const Snapshot = require('./models/Snapshot');


//////SERVER STARTS HERE///////

app.use(express.json());

app.get('/', (req, res) => {
    console.log('hello')
    res.send('stockbot home')
});

app.get('/fetch', async (req, res) => {
    // let tickers = await binance.futuresPrices();
    // let newSnapShot = new Snapshot({
    //     tickers
    // })

    // newSnapShot.save()
    //     .catch(err => console.log(err)); 
    let status = await fetchPrices()

    res.status(200).json(status).end();
})

app.listen(PORT, () => console.log(`StockBot listening on port ${PORT}`));