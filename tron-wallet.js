
const TronWeb = require('tronweb')
const { ec } = require('elliptic')
const fullNode = 'https://api.trongrid.io'
const solidityNode = 'https://api.trongrid.io'
const eventServer = 'https://api.trongrid.io/'

class TronWallet {
  constructor (opts = {}) {
    this.deserialize(opts)
  }

  serialize () {
    return Promise.resolve(this.privateKey)
  }

  deserialize (opts = {}) {
    this.privateKey = opts.privateKey.replace(/^0x/, '')
    this.wallet = new TronWeb(fullNode, solidityNode, eventServer, this.privateKey)
    this.address = this.wallet.defaultAddress.base58
    this.hexAddress = this.wallet.defaultAddress.hex
  }

  signTransaction(tx) {
    return this.wallet.trx.sign(tx)
  }

  signMessage(data) {
    return this.wallet.trx.sign(data, this.privateKey, true)
  }

  // Utils
  static generate() {
    const e = new ec('secp256k1')
    const privateKeyBN = e.genKeyPair().getPrivate()
    let privateKey = privateKeyBN.toString('hex')
    while (privateKey.length < 64) {
      privateKey = '0' + privateKey
    }
    return new TronWallet({ privateKey })
  }
}

module.exports = TronWallet
