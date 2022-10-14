const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnalysisSchema = new Schema({
    id: { type: String },
    product_id: { type: String },
    percent: { type: Number },
    delta: { type: Object },
    currentPrice: { type: Number },
    time: { type: Number },
    date: { type: Date, default: Date() },
})

const Analysis = mongoose.model('Analysis', AnalysisSchema)

module.exports = Analysis;