const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SaleSchema = new Schema({
    id: { type: String },
    traderId: { type: String },
    asset: { type: String },
    quantity: { type: Number },
    purchasePrice: { type: Number },
    sellPrice: { type: Number },
    profit: { type: Number },
    duration: { type: Number },
    date: { type: Date, default: Date() },
})

const Sale = mongoose.model('Sale', SaleSchema)

module.exports = Sale;