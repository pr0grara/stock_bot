const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SchemaTypes = Schema.Types

const SnapshotSchema = new Schema({
    ticker: { type: String, required: true },
    usd: { type: SchemaTypes.Decimal128, required: true }
})

const Snapshot = mongoose.model('Snapshot', new mongoose.Schema({}))