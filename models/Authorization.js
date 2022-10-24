const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AuthorizationSchema = new Schema({
    id: { type: String, unique: true },
    mfa: { type: Boolean, default: false },
    hash: { type: String },
    unix: { type: Number, required: true },
    date: { type: Date },
})

const Authorization = mongoose.model('Authorization', AuthorizationSchema)

module.exports = Authorization;