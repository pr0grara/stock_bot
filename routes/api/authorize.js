const bcrypt = require('bcrypt');
const Authorization = require('../../models/Authorization');
const express = require('express');
const { createAuthorization } = require('../../authorize_util');
const route = express.Router();

route.post('/authorize', (req, res) => {
    console.log(req);
    console.log(req.body);
})

route.get('/create', (req, res) => {
    createAuthorization();
})

module.exports = route;