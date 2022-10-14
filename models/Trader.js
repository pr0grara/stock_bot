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
    date: { type: Date, default: Date() },
    unix: { type: Number, default: Date.now() },
    liquidatedAt: { type: Date }
})

const Trader = mongoose.model('Trader', TraderInstanceSchema)

module.exports = Trader;