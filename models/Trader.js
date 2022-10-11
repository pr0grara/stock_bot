const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TraderInstanceSchema = new Schema({
    id: { type: String },
    asset: { type: String },
    quantity: { type: Number },
    price: { type: Number },
    sellTarget: { type: Number },
    buyTarget: { type: Number },
    allowance: { type: Number },
    receipt: { type: Object },
    date: { type: Date, default: Date() }
})

const Trader = mongoose.model('Trader', TraderInstanceSchema)

module.exports = Trader;