const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AuthorizationSchema = new Schema({
    token: { type: String, unique: true },
    hash: { type: String },
    authorized: { type: Boolean, default: false },
    mfa_code: { type: Number },
    unix: { type: Number, required: true },
    date: { type: Date },
})

const Authorization = mongoose.model('Authorization', AuthorizationSchema)

module.exports = Authorization;