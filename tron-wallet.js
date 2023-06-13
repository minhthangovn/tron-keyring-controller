
const TronWeb = require('tronweb')
const TronGrid = require('trongrid');

const { ec } = require('elliptic')
const fullNode = 'https://nile.trongrid.io'
const solidityNode = 'https://nile.trongrid.io'
const eventServer = 'https://nile.trongrid.io/'

const unit = 1000000;
class TronWallet {

  constructor(opts = {}) {
    this.deserialize(opts)
  }

  serialize() {
    return Promise.resolve(this.privateKey)
  }

  deserialize(opts = {}) {
    this.privateKey = opts.privateKey.replace(/^0x/, '')
    this.wallet = new TronWeb(fullNode, solidityNode, eventServer, this.privateKey)
    this.address = this.wallet.defaultAddress.base58
    this.hexAddress = this.wallet.defaultAddress.hex
    this.tronGrid = new TronGrid(this.wallet);

  }

  signTransaction(transaction) {
    return this.wallet.trx.sign(transaction)
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

  async txSend(fromAddress, toAddress, amount) {
    return await this.wallet.transactionBuilder.sendTrx(
      toAddress,
      amount * unit
    );
  }

  async txTransferTRC20(contract, fromAddress, toAddress, amount) {
    // tronWeb.toSun(10) >"10000000"
    const options = {
      feeLimit: 50 * unit,
      callValue: 0
    };
    const input = [{ type: 'address', value: await this.toHex(toAddress) }, { type: 'uint256', value: amount * unit }];
    return await this.wallet.transactionBuilder.triggerSmartContract(
      contract,
      'transfer(address,uint256)',
      options,
      input,
      await this.toHex(fromAddress),
    );
  }

  async getBalance(address) {
    await this.wallet.trx.getBalance(address);
  }

  async getTRC20Balance(contract, address) {
    const detail = await this.wallet.trx.getContract(contract);
    let contractTrx = await window.tronWeb.contract(detail.abi.entrys, contract);
    return contractTrx.balanceOf(address).call();
  }

  async getBandwidth(address) {
    await this.wallet.trx.getBandwidth(address);
  }

  

  // transactionBuilder.estimateEnergy
  // {
  //   "owner_address": "TSNEe5Tf4rnc9zPMNXfaTF5fZfHDDH8oyW",
  //   "contract_address": "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs",
  //   "function_selector": "balanceOf(address)",
  //   "parameter": "000000000000000000000000a614f803b6fd780986a42c78ec9c7f77e6ded13c",
  //   "visible": true
  // }
  // getcontractinfo
  // walletsolidity/getaccount: including TRX balance, TRC-10 balances, stake

  async getAccountNet(address) {
    await this.wallet.wrapper.getAccountNet(address);
  }

  async broadcastTx(signedTx) {
    return await this.wallet.trx.sendRawTransaction(signedTx);
  }

  async toHex(address) {
    return this.wallet.address.toHex(address);
  }

  async getTransaction(address) {
    await this.wallet.trx.getTransaction(address);
  }

  async getTransactions(address) {
    // const address = 'TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY';

    const options = {
      onlyTo: true,
      onlyConfirmed: true,
      limit: 100,
      orderBy: 'timestamp,asc',
      minBlockTimestamp: Date.now() - 60000 // from a minute ago to go on
    };

    return await this.tronGrid.account.getTransactions(address, options);    
  }

}




module.exports = TronWallet
