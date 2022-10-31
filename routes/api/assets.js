const { validateToken } = require('../../authorize_util');
const { generateAssetsForClient } = require('../../stock_util/coinbasepro/analyze');

const route = require('express').Router();

route.get('/', (req, res) => {
    res.status(200).send('Assets home route').end();
});

route.get('/fetch-for-client', async (req, res) => {
    console.log('assetsData requested');
    let token = req.headers.token;
    let validated = await validateToken(token);
    if (!validated) return res.status(401).end();
    let assetsObj = await generateAssetsForClient();
    return res.status(200).json(assetsObj).end();
})

module.exports = route;