
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

  static hexStringToBase58 (sHexString) {
    return TronWeb.address.fromHex(sHexString)
  }

  static base58ToHexString (sBase58) {
    if (sBase58.length == 44 && sBase58.indexOf('0x') == 0) {
      sBase58 = sBase58.slice(2)
    }
    if (sBase58.length == 42 && sBase58.indexOf('41') == 0) {
      return sBase58
    }
    return TronWeb.address.toHex(sBase58)
  }

  static base58ToHexAddress (sBase58) {
    return '0x' + TronWeb.address.toHex(sBase58)
  }

}

module.exports = TronWallet
