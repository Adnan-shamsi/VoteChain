const crypto = require('crypto')

const ALGORITHM = "SHA256"
const fs = require('fs')
const path = require('path')

const pem = fs.readFileSync(path.join(__dirname, 'mainNode.pem'))
const pub = fs.readFileSync(path.join(__dirname, 'mainNode.pub'))
const SIGN_KEY = pem.toString('ascii')
const VERIFY_KEY = pub.toString('ascii')

function verifySignature(data, signature) {
    const verifier = crypto.createVerify(ALGORITHM)
    verifier.update(JSON.stringify(data), 'ascii')
    return verifier.verify(VERIFY_KEY, Buffer.from(signature, 'hex'))

}

function issueSignature(data) {
    const sign = crypto.createSign(ALGORITHM)
    sign.update(JSON.stringify(data))
    return sign.sign(SIGN_KEY, 'hex')
}
module.exports = { verifySignature, issueSignature }