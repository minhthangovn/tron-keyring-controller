const EventEmitter = require('events').EventEmitter
const TronWallet = require('./tron-wallet')
const type = 'Simple Key Pair'

class SimpleKeyring extends EventEmitter {

  /* PUBLIC METHODS */

  constructor (opts) {
    super()
    this.type = type
    this.wallets = []
    this.deserialize(opts)
  }

  serialize () {
    return Promise.resolve(this.wallets.map(w => w.privateKey))
  }

  deserialize (privateKeys = []) {
    return new Promise((resolve, reject) => {
      try {
        this.wallets = privateKeys.map(privateKey => new TronWallet({ privateKey }))
      } catch (e) {
        reject(e)
      }
      resolve()
    })
  }

  addAccounts (n = 1) {
    var newWallets = []
    for (var i = 0; i < n; i++) {
      newWallets.push(TronWallet.generate())
    }
    this.wallets = this.wallets.concat(newWallets)
    return Promise.resolve(w => w.address)
  }

  getAccounts () {
    return Promise.resolve(this.wallets.map(w => w.address))
  }

  // tx is an instance of the ethereumjs-transaction class.
  signTransaction (address, tx) {
    const wallet = this._getWalletForAccount(address)
    return wallet.signTransaction(tx)
  }

  // For eth_sign, we need to sign arbitrary data:
  signMessage (withAccount, data) {
    const wallet = this._getWalletForAccount(withAccount)
    return Promise.resolve(wallet.signMessage(data))
  }
  
  /* TODO:(MegTron)
  // For personal_sign, we need to prefix the message:
  signPersonalMessage (withAccount, msgHex) {
    const wallet = this._getWalletForAccount(withAccount)
    const privKey = ethUtil.stripHexPrefix(wallet.getPrivateKey())
    const privKeyBuffer = new Buffer(privKey, 'hex')
    const sig = sigUtil.personalSign(privKeyBuffer, { data: msgHex })
    return Promise.resolve(sig)
  }

  // personal_signTypedData, signs data along with the schema
  signTypedData (withAccount, typedData) {
    const wallet = this._getWalletForAccount(withAccount)
    const privKey = ethUtil.toBuffer(wallet.getPrivateKey())
    const sig = sigUtil.signTypedData(privKey, { data: typedData })
    return Promise.resolve(sig)
  }
  */

  // exportAccount should return a hex-encoded private key:
  exportAccount (address) {
    const wallet = this._getWalletForAccount(address)
    return Promise.resolve(wallet.privateKey)
  }

  removeAccount (address) {
    if(!this.wallets.map(w => w.address.toLowerCase()).includes(address.toLowerCase())){
      throw new Error(`Address ${address} not found in this keyring`)
    }
    this.wallets = this.wallets.filter(w => w.address.toLowerCase() !== address.toLowerCase())
  }

  /* PRIVATE METHODS */

  _getWalletForAccount (account) {
    let wallet = this.wallets.find(w => w.address === account )
    if (!wallet) throw new Error('Simple Keyring - Unable to find matching address.')
    return wallet
  }
}

SimpleKeyring.type = type
module.exports = SimpleKeyring
