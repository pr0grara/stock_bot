const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssetSchema = new Schema({
    ticker: { type: String, required: true, unique: true },
    product_id: { type: String, unique: true },
    lastPrice: { type: Number, required: true },
    history: { type: Object },
    performance: { type: Object },
    threeDayMean: { type: Number },
    threeDayLow: { type: Number },
    threeDayHigh: { type: Number },
    twelveDayMean: { type: Number },
    twelveDayLow: { type: Number },
    twelveDayHigh: { type: Number },
    seventyFiveDayMean: { type: Number },
    seventyFiveDayLow: { type: Number },
    seventyFiveDayHigh: { type: Number },
    unix: { type: Number, default: Date.now() },
    createdOn: { type: Date, default: Date() },
})

const Asset = mongoose.model('Asset', AssetSchema);

module.exports = Asset;