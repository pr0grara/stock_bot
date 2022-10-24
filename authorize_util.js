const { SEND_SMS, idGenerator } = require("./util");
const Authorization = require('./models/Authorization');

const createAuthorization = async (id) => {
    let newAuthorization = new Authorization({
        id,
        mfa: false,
        unix: Date.now(),
        date: Date()
    });
    let recordCreatedBool = !!(await newAuthorization.save().catch(e => {}));
    return recordCreatedBool;
}

const fetchAndAuthorize = async (id) => {
    let authorization = await Authorization.findOne({ id });

    console.log(authorization)
}

const validateNewToken = async () => {
    let id = idGenerator(14);
    let recordCreatedBool = await createAuthorization();
    if (recordCreatedBool) SEND_SMS("Authorize New Token? 1=YES 0=NO");
    fetchAndAuthorize();
}

// createAuthorization("1234")

module.exports = { validateNewToken }