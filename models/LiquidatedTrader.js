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
    date: { type: Date, default: Date() },
    liquidatedAt: { type: Date }
})

const LiquidatedTrader = mongoose.model('LiquidatedTrader', TraderInstanceSchema)

module.exports = LiquidatedTrader;