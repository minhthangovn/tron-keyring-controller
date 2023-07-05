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
// const bip32 = require('bip32')
const ecc = require('@bitcoinerlab/secp256k1')
const { BIP32Factory } = require('bip32')
// You must wrap a tiny-secp256k1 compatible implementation
const bip32 = BIP32Factory(ecc)

const bip39 = require('bip39')
const TronWallet = require('./tron-wallet')

// console.log("### dbip32: ", dbip32);
// console.log("### ecc: ", ecc);

// // const BIP32Interface = require('bip32')
// // You must wrap a tiny-secp256k1 compatible implementation
// const bip32 = dbip32.BIP32Factory(ecc);


const BIP44_INDEX = '195'

// Options:
const type = 'HD Key Tree'

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

class HdKeyring extends EventEmitter {

  /* PUBLIC METHODS */

  constructor(opts = {}) {
    super()
    this.type = type
    this.deserialize(opts)
  }

  serialize() {
    log.debug('tronhd serialize')
    return Promise.resolve({
      mnemonic: this.mnemonic,
      numberOfAccounts: this.wallets.length,
    })
  }

  deserialize(opts = {}) {
    log.debug('tronhd deserialize')
    this.opts = opts || {}
    this.wallets = []
    this.mnemonic = null
    this.root = null
    this.testNet = opts.testNet || false
    this.currentRpcTarget = opts.currentRpcTarget || DefaultNetwork;

    if (opts.mnemonic) {
      this._initFromMnemonic(opts.mnemonic)
    }

    if (opts.numberOfAccounts) {
      return this.addAccounts(opts.numberOfAccounts)
    }

    return Promise.resolve([])
  }

  addAccounts(numberOfAccounts = 1) {
    log.debug('tronhd addaccounts')
    if (!this.root) {
      // Use 24 words mnemonic phrase
      // this._initFromMnemonic(bip39.generateMnemonic(256))
      // Use 14 words mnemonic phrase
      this._initFromMnemonic(bip39.generateMnemonic(128))
    }

    const oldLen = this.wallets.length
    const newWallets = []
    const rpcTarget = this.currentRpcTarget;
    for (let i = oldLen; i < numberOfAccounts + oldLen; i++) {
      // TODO: not really HD implmentation, but good enough currently.
      const child = this.root.derivePath(`m/44'/${BIP44_INDEX}'/${i}'/0/0`, this.seed);
      const privateKey = child.privateKey.toString('hex');
      const wallet = new TronWallet({ privateKey, rpcTarget })
      newWallets.push(wallet)
      this.wallets.push(wallet)
    }
    return Promise.resolve(newWallets.map((w) => w.address))
  }

  async switcherNetwork(rpcTarget) {
    this.currentRpcTarget = rpcTarget;
    for (const wallet of this.wallets) {
      await wallet.updateRpcTarget(rpcTarget);
    }
  }

  getAccounts() {
    log.debug('tronhd getaccounts')
    return Promise.resolve(this.wallets.map((w) => w.address))
  }

  // tx is an instance of the ethereumjs-transaction class.
  signTransaction(withAccount, tx) {
    log.debug('tronhd signTX')
    console.log("### tx: ", tx);
    // console.log("### tx.transaction.raw_data.contract: ", tx.transaction.raw_data.contract);

    const wallet = this._getWalletForAccount(withAccount);
    return wallet.signTransaction(tx);
  }

  signTRC20Transaction(withAccount, tx) {
    log.debug('tronhd TRC20 signTX');
    const wallet = this._getWalletForAccount(withAccount);
    return wallet.signTransaction(tx.transaction);
  }

  async txSend(fromAddress, toAddress, amount) {
    const tronWallet = this._getWalletForAccount(fromAddress);
    return await tronWallet.txSend(toAddress, amount);
  }

  async txTransferTRC20(contract, fromAddress, toAddress, amount) {
    const tronWallet = this._getWalletForAccount(fromAddress);
    return await tronWallet.txTransferTRC20(contract, fromAddress, toAddress, amount);
  }

  async getTransferTRC20Info(contract, fromAddress, toAddress, amount) {
    const tronWallet = this._getWalletForAccount(fromAddress);
    return await tronWallet.getTransferTRC20Info(contract, fromAddress, toAddress, amount);
  }


  async broadcastTx(address, signedTx) {
    const tronWallet = this._getWalletForAccount(address);
    return await tronWallet.broadcastTx(signedTx);
  }


  async getBalance(address) {
    const tronWallet = this._getWalletForAccount(address);
    // https://api.shasta.trongrid.io/v1/accounts/{address} - balance, others...
    return await tronWallet.getBalance(address);
  }

  async getChainParameters(address) {
    const tronWallet = this._getWalletForAccount(address);
    return await tronWallet.getChainParameters();
  }

  async getTRC20Balance(contract, address) {
    const tronWallet = this._getWalletForAccount(address);
    return await tronWallet.getTRC20Balance(contract, address);
  }
  // getTRC20Balance

  async getBandwidth(address) {
    const tronWallet = this._getWalletForAccount(address);
    return await tronWallet.getBandwidth(address);
  }

  
  async getContract(address, contract) {
    const tronWallet = this._getWalletForAccount(address);
    return await tronWallet.getContract(contract, address);
  }

  
  

  async getTransaction(address) {
    const tronWallet = this._getWalletForAccount(address);
    return await tronWallet.getTransaction(address);
  }

  async getAccountNet(address) {
    const tronWallet = this._getWalletForAccount(address);
    return await tronWallet.getAccountNet(address);
  }

  // For eth_sign, we need to sign transactions:
  signMessage(withAccount, data) {
    log.debug('tronhd signMSG')
    const wallet = this._getWalletForAccount(withAccount);
    return wallet.signMessage(data);
  }

  exportAccount(address) {
    log.debug('tronhd exporthd')
    const wallet = this._getWalletForAccount(address);
    return Promise.resolve(wallet.privateKey);
  }


  async getTransactions(address) {
    const tronWallet = this._getWalletForAccount(address);
    return await tronWallet.getTransactions(address);
  }


  /* PRIVATE METHODS */

  _initFromMnemonic(mnemonic) {
    log.debug('tronhd _initFromMnemonic')
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error(`Invalid Mnemonic provided: ${mnemonic}`);
    }
    this.mnemonic = mnemonic
    this.seed = bip39.mnemonicToSeedHex(mnemonic);
    this.root = bip32.fromSeed(new Buffer(this.seed, 'hex'))
  }

  _getWalletForAccount(account) {
    let wallet = this.wallets.find(w => w.address === account)
    if (!wallet) throw new Error('HD Keyring - Unable to find matching address.')
    return wallet
  }
}

HdKeyring.type = type
module.exports = HdKeyring

