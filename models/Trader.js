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
    proximity: { type: Number },
    proximityHistory: { type: Object },
    sellPriceAdjust: { type: Array },
    date: { type: Date },
    unix: { type: Number },
    liquidatedAt: { type: Date }
})

const Trader = mongoose.model('Trader', TraderInstanceSchema)

module.exports = Trader;