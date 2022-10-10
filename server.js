require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const ccxt = require('ccxt');
const axios = require('axios');
const PORT = process.env.PORT || 3000;

console.log(ccxt.exchanges)


const Binance = require('node-binance-api');
const { ethereum } = require('./ccxt');
const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.SECRET_KEY
});

// mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log('connected to mongo'))
//     .catch(() => console.log('error connecting to mongo'));
//////SERVER STARTS HERE///////

app.use(express.json());

app.get('/', (req, res) => {
    console.log('hello')
    res.send('stockbot home')
});

app.get('/fetch', async (req, res) => { 
    let status = await fetchPrices()
    res.status(200).json(status).end();
})

const tick = async (config, binanceClient) => {
    const { asset, base, spread, allocation } = config;
    const market = `${asset}/${base}`;

    // const orders = await binanceClient.fetchOpenOrders;
    // console.log(orders)
    // if (orders) {
    //     orders.forEach(async order => {
    //         await binanceClient.cancelOrder(order.id);
    //     });
    // }

    const results = await Promise.all([
        axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'),
        axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd')
    ])

    const marketPrice = results[0].data.bitcoin.usd / results[1].data.tether.usd;

    const sellPrice = marketPrice * (1 + spread);
    const buyPrice = marketPrice * (1 - spread);
    const balances = await binance.futuresBalance();
    console.log(balances)
    const assetBalance = balances.free[asset];
    const baseBalance = balances.free[base];
    const sellVolume = assetBalance * allocation;
    const buyVolume = (baseBalance * allocation) / marketPrice;

    // await binanceClient.createLimitSellOrder(market, sellVolume, sellPrice);
    // await binanceClient.createLimitBuyOrder(market, buyVolume, buyPrice);

    console.log(`
        New tick for ${market}...
        Created limit sell order for ${sellVolume} @${sellPrice}
        Created limit buy order for ${buyVolume} @${buyPrice}
    `)
};

const run = () => {
    const config = {
        asset: "BTC",
        base: "USDT",
        allocation: .1,
        spread: .2,
        tickinterval: 2000
    }
    const binanceClient = new ccxt.binance({
        apiKey: process.env.API_KEY,
        secret: process.env.SECRET_KEY
    })
    tick(config, binanceClient)
    setInterval(tick, config.tickinterval, config, binanceClient)
};

run();

// app.listen(PORT, () => console.log(`StockBot listening on port ${PORT}`));