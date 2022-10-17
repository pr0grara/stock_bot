// const axios = require('axios');
// const { PROXY_URL } = require('../config');
const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const numPicker = (boolean) => {
    var num;
    if (boolean) {
        num = Math.floor(Math.random() * 9);
    } else {
        num = Math.floor(Math.random() * 74) + 48;
    }
    return num;
}

const idGenerator = (length, onlyNumBoolean) => {
    length = length || 12;
    var id = ""
    while (id.length < length) {
        var num = numPicker(onlyNumBoolean);
        while ((num > 57 && num < 65) || (num > 90 && num < 97)) num = numPicker();
        if (onlyNumBoolean) {
            id = id + num.toString();
        } else {
            id = id + String.fromCharCode(num);
        }
    }
    return id;
}

// const axiosInstance = () => {
//     return axios.create({
//         baseURL: PROXY_URL,
//     });
// };

const CREATE_LOOP = (func, min) => {
    func()
    setTimeout(() => {
        CREATE_LOOP(func, min)
    }, 1000 * 60 * min)
};

const SEND_SMS = (message) => {
    twilio.messages
        .create({
            body: message,
            from: "+13158030650",
            to: "+19252553225"
        });
};

module.exports = {  numPicker, idGenerator, CREATE_LOOP, SEND_SMS };