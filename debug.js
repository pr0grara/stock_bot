const axios = require('axios');

const getBalance = async () => {
    const balance = await new Promise(() => {
        axios.get('https://api.binance.us/api/v3/account', { headers: { 'X-MBX-APIKEY': "zKoGAWY0z6YxjDPg9VZOHKdqZZPFOdb4R2SITTHIjZTpyB7XFkwQ2iuZat3zg36S" }})
    })
    
    console.log(balance)
}

getBalance()