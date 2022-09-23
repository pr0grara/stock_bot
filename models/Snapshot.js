const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SnapshotSchema = new Schema({
    tickers: {type: Object, required: true},
    date: { type: Date, default: Date() }
})

const Snapshot = mongoose.model('Snapshot', SnapshotSchema)

module.exports = Snapshot;