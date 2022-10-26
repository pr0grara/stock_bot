const bcrypt = require('bcrypt');
const cors = require('cors');
const Authorization = require('../../models/Authorization');
const express = require('express');
const { MFA, authenticateToken } = require('../../authorize_util');
const route = express.Router();

route.post('/authorize', (req, res) => {
    console.log(req);
    console.log(req.body);
})

route.post('/new-token', cors(true), async (req, res) => {
    let token = await MFA();
    if (!!token) return res.status(200).json(token).end();
    return res.status(500).send('error creating auth record').end();
});

route.post('/mfa-attempt', async (req, res) => {
    let token = req.body.token;
    let mfa_code = req.body.mfa_code;
    let authenticated = await authenticateToken(token, mfa_code);
    if (authenticated) return res.status(200).send(true).end();
    return res.status(404).send(false).end();
});

module.exports = route;