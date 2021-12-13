const crypto = require('crypto')
const SIGN_KEY = "a very good and secure key"
const ALGORITHM = "SHA256"

function verifySignature(data, signature) {
    return crypto.verify(ALGORITHM, JSON.stringify(data), signature, SIGN_KEY)
}

module.exports = { verifySignature }