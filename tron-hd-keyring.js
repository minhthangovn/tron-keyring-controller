/* Tron HD Keyring
 * 
 * Similar to github.com/MetaMask/eth-hd-keyring, this pacakge provides a
 * Keyring Class Protocol, to be used in KeyringController, like is being
 * used in MetaMask.
 * 
 * Thanks to tronprotocol/tron-web and TronWatch/TronLink
 */ 

const log = require('loglevel')
const EventEmitter = require('events').EventEmitter
const bip32 = require('bip32')
const bip39 = require('bip39')
const ethUtil = require('ethereumjs-util');
const TronWeb = require('tronweb')

const fullNode = 'https://api.trongrid.io'
const solidityNode = 'https://api.trongrid.io'
const eventServer = 'https://api.trongrid.io/'
const BIP44_INDEX = '195'

// Options:
const type = 'HD Key Tree'

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

class HdKeyring extends EventEmitter {

  /* PUBLIC METHODS */

  constructor (opts = {}) {
    super()
    this.type = type
    this.deserialize(opts)
  }

  serialize () {
    log.debug('tronhd serialize')
    return Promise.resolve({
      mnemonic: this.mnemonic,
      numberOfAccounts: this.wallets.length,
    })
  }

  deserialize (opts = {}) {
    log.debug('tronhd deserialize')
    this.opts = opts || {}
    this.wallets = []
    this.mnemonic = null
    this.root = null
    this.testNet = opts.testNet || false

    if (opts.mnemonic) {
      this._initFromMnemonic(opts.mnemonic)
    }

    if (opts.numberOfAccounts) {
      return this.addAccounts(opts.numberOfAccounts)
    }

    return Promise.resolve([])
  }

  addAccounts (numberOfAccounts = 1) {
    log.debug('tronhd addaccounts')
    if (!this.root) {
      this._initFromMnemonic(bip39.generateMnemonic())
    }

    const oldLen = this.wallets.length
    const newWallets = []
    for (let i = oldLen; i < numberOfAccounts + oldLen; i++) {
      // TODO: not really HD implmentation, but good enough currently.
      const child = this.root.derivePath(`m/44'/${ BIP44_INDEX }'/${ i }'/0/0`, this.seed);
      const privateKey = child.privateKey.toString('hex');
      const wallet = new TronWeb(fullNode, solidityNode, eventServer, privateKey)
      newWallets.push(wallet)
      this.wallets.push(wallet)
    }
    const hexWallets = newWallets.map((w) => {
      return w.defaultAddress.base58
    })
    return Promise.resolve(hexWallets)
  }

  getAccounts () {
    log.debug('tronhd getaccounts')
    return Promise.resolve(this.wallets.map((w) => {
      // return TronWeb.address.fromPrivateKey(w.defaultPrivateKey)
      return w.defaultAddress.base58
    }))
  }

  // tx is an instance of the ethereumjs-transaction class.
  signTransaction (withAccount, tx) {
    log.debug('tronhd signTX')
    const wallet = this._getWalletForAccount(withAccount)
    return wallet.trx.sign(tx)
  }

  // For eth_sign, we need to sign transactions:
  // hd
  signMessage (withAccount, data) {
    log.debug('tronhd signMSG')
    const wallet = this._getWalletForAccount(withAccount)
    var privKey = wallet.defaultPrivateKey
    return wallet.trx.sign(data, privKey, true)
  }

  exportAccount (address) {
    log.debug('tronhd exporthd')
    const wallet = this._getWalletForAccount(address)
    return Promise.resolve(wallet.defaultPrivateKey)
  }

  /* PRIVATE METHODS */

  _initFromMnemonic (mnemonic) {
    log.debug('tronhd _initFromMnemonic')
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error(`Invalid Mnemonic provided: ${mnemonic}`);
    }
    this.mnemonic = mnemonic
    this.seed = bip39.mnemonicToSeedHex(mnemonic);
    this.root = bip32.fromSeed(new Buffer(this.seed, 'hex'))
  }

  _getWalletForAccount (account) {
    return this.wallets.find((w) => {
      return w.defaultAddress.base58 === account
    })
  }
}

HdKeyring.type = type
module.exports = HdKeyring

