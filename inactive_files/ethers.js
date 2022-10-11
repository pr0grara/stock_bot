require('dotenv').config()
const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider({
    url: 'https://mainnet.ethereum.coinbasecloud.net',
    user: process.env.COINBASE_USERID,
    password: process.env.COINBASE_PWRD,
});

// provider.getEtherPrice()
//     .then(res=> console.log(res))

const run = async () => {
    const balance = await provider.getBalance(process.env.COINBASE_ADDRESS)
    // const balanceFormatted = ethers.utils.formatEther(balance)
    console.log('Your ETH balance is ', balance);
}

run();

// // web3.js
// const Web3 = require('web3');
// const endpoint = 'https://mainnet.ethereum.coinbasecloud.net';
// const base64String = Buffer.from('UWRRDL2GCHYBUWSCCGP6:UL5LJIEFB4BY6PHQY6NFTG3X62Q5CSLD42LEC4WG').toString('base64');
// const options = {
//     keepAlive: true,
//     withCredentials: true,
//     timeout: 20000, // ms
//     headers: [{ name: "Authorization", value: "Basic " + base64String }],
// };

// const web3Provider = new Web3.providers.HttpProvider(endpoint, options);
// const web3 = new Web3(web3Provider);
// const balance = await web3.eth.getBalance('0xc94770007dda54cF92009BFF0dE90c06F603a09f')
// const balanceFormatted = web3.utils.fromWei(balance)
// console.log('Your ETH balance is ', balanceFormatted);