const { SEND_SMS, idGenerator } = require("./util");
const Authorization = require('./models/Authorization');

const generateTwoFactorCode = () => {
}

const createAuthorization = async () => {
    let id = idGenerator(14);
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
    let mfa_code = idGenerator(4, true);
    let recordCreatedBool = await createAuthorization();
    if (recordCreatedBool) SEND_SMS(`MFA Code for New Token: ${mfa_code}`);
    fetchAndAuthorize();
}

// createAuthorization("1234")

module.exports = { validateNewToken }