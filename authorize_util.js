const { SEND_SMS, idGenerator } = require("./util");
const Authorization = require('./models/Authorization');
const bcrypt = require('bcrypt');

const generateTwoFactorCode = () => {
}

const createAuthorization = async (mfa_code) => {
    let token = idGenerator(14);
    // let hash = await bcrypt.hash(token, 5);
    let newAuthorization = new Authorization({
        token,
        // hash,
        authorized: false,
        mfa_code,
        unix: Date.now(),
        date: Date()
    });
    let recordCreatedBool = !!(await newAuthorization.save());
    return [token, recordCreatedBool];
};

const MFA = async () => {
    let mfa_code = idGenerator(4, true);
    let [token, recordCreatedBool] = await createAuthorization(mfa_code);
    if (recordCreatedBool) SEND_SMS(`MFA Code for New Token: ${mfa_code}`);
    return token;
};

const authenticateToken = async (token, mfa_code) => {
    let authentication = await Authorization.findOne({ token });
    if (!authentication) return false;
    if (authentication.mfa_code === mfa_code) {
        authentication.updateOne({ $set: {authorized: true} }).then(() => console.log('updated auth record')).catch(e=>console.log(e));
        return true;
    };
    return false;
};

const cleanTokens = async () => {
    let authentications = await Authorization.find({});
    let unix = Date.now();
    
    let unvalidated = authentications.filter(record => !record.authorized);
    for (const record of unvalidated) if ((unix - record.unix) / 1000 / 60 > 5) record.deleteOne({});

    let validated = authentications.filter(record => !!record.authorized);
    for (const record of validated) if ((unix - record.unix) / 1000 / 60 / 60 / 24 > 1) record.deleteOne({});

};

module.exports = { MFA, authenticateToken, cleanTokens }