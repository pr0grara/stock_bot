const cors = require('cors');
const jwt = require("jsonwebtoken");
const Authorization = require('../../models/Authorization');
const express = require('express');
const { MFA, authenticateToken } = require('../../authorize_util');
const route = express.Router();

route.post('/validate-token', async (req, res) => {
    let token = req.body.token;
    let authorization = await Authorization.findOne({ token });
    if (!authorization) return res.status(200).send(false).end();
    if (!!authorization && authorization.authorized) return res.status(200).send(true).end();
    return res.status(200).send(false).end();
})

route.post('/new-token', cors(true), async (req, res) => {
    let token = await MFA();
    if (!!token) return res.status(200).json(token).end();
    return res.status(500).send('error creating auth record').end();
});

route.post('/mfa-attempt', cors(true), async (req, res) => {
    let token = req.body.token;
    let mfa_code = req.body.mfa_code;
    let authenticated = await authenticateToken(token, mfa_code);
    if (authenticated) return res.status(200).send(true).end();
    return res.status(404).send(false).end();
});

route.post('/new-mongo-chart-token', cors(true), async (req, res) => {
    let token = req.body.token;
    const authorizationRecord = await Authorization.findOne({ token });
    if (!authorizationRecord || !authorizationRecord.authorized) return res.status(404).send('unauthorized').end();
    let chartToken = jwt.sign({ username: "MongoDB" }, process.env.MONGO_DASHBOARD_SECRET, {
        expiresIn: "24h" // expires in 24 hours
    }); 
    res.status(200).json(chartToken).end();
})

module.exports = route;