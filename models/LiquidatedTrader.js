const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TraderInstanceSchema = new Schema({
    id: { type: String },
    asset: { type: String },
    quantity: { type: Number },
    purchasePrice: { type: Number },
    sellPrice: { type: Number },
    rebuyPrice: { type: Number },
    allowance: { type: Number },
    buyReceipt: { type: Object },
    sellReceipt: { type: Object },
    botBuy: { type: Boolean },
    longPosition: { type: Boolean },
    currentPrice: { type: Number },
    proximity: { type: Number },
    proximityHistory: { type: Object },
    sellPriceAdjust: { type: Array },
    date: { type: Date },
    unix: { type: Number },
    age: { type: Number },
    liquidatedAt: { type: Date },
    RUN_LENGTH: { type: Number },
    NET_PROFIT: { type: Number },
    PROFIT_PER_DAY: { type: Number },
    DOLLARS_INVESTED: { type: Number },
    DAILY_INTEREST: { type: Number },
    APY: { type: Number },
})

const LiquidatedTrader = mongoose.model('LiquidatedTrader', TraderInstanceSchema)

module.exports = LiquidatedTrader;