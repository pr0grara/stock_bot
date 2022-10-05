require('dotenv').config();
const ccxt = require('ccxt');

let coinbase = new ccxt.coinbase({
    apiKey: process.env.COINBASEPRO_KEY,
    secret: process.env.COINBASEPRO_SECRET
});

console.log(process.env.COINBASEPRO_KEY, process.env.COINBASEPRO_SECRET)

const run = async () => {
    let balance = await coinbase.fetchBalance()
    console.log(balance)
}

run()