const assert = require('assert')
const HdKeyring = require('../tron-hd-keyring')

const sampleMnemonic = 'decline rice regret twice apple unknown melt puzzle spot echo banana tornado mountain text output arrive tomorrow flat oppose scrub bless impact hockey recycle'
const firstAcct = 'TDKcAPfAu42Js6dqirkUcfos9S9pPzoCbh'
const firstAcctPrivateKey = '5443ace14fc73ec711698af2766747ccb6d55a56b9eeda9c03f53f891524bac8'
const secondAcct = 'TJXW2Apt9UboV1VCyWoutjQBNtTGaJSmrh'
const hexAddress = '4124c407c426286f1ba71d1287ab08788bde58e52f'

describe('TronHDKeyring', function () {

  let keyring
  beforeEach(function () {
    keyring = new HdKeyring()
  })

  describe('constructor', function (done) {
    it('constructs', function (done) {
      keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        numberOfAccounts: 2,
        testNet: false,
      })

      const accounts = keyring.getAccounts()
      .then((accounts) => {
        assert.equal(accounts[0], firstAcct)
        assert.equal(accounts[1], secondAcct)
        done()
      })
    })
  })

  describe('Keyring.type', function () {
    it('is a class property that returns the type string.', function () {
      const type = HdKeyring.type
      assert.equal(typeof type, 'string')
    })
  })
  describe('#type', function() {
    it('returns the correct value', function() {
      const type = keyring.type
      const correct = HdKeyring.type
      assert.equal(type, correct)
    })
  })

  describe('#serialize empty wallets.', function() {
    it('serializes a new mnemonic', function() {
      keyring.serialize()
      .then((output) => {
        assert.equal(output.numberOfAccounts, 0)
        assert.equal(output.mnemonic, null)
      })
    })
  })

  describe('#deserialize a private key', function() {
    it('serializes what it deserializes', function(done) {
      keyring.deserialize({
        mnemonic: sampleMnemonic,
        numberOfAccounts: 1
      })
      .then(() => {
        assert.equal(keyring.wallets.length, 1, 'restores two accounts')
        return keyring.addAccounts(1)
      }).then(() => {
        return keyring.getAccounts()
      }).then((accounts) => {
        assert.equal(accounts[0], firstAcct)
        assert.equal(accounts[1], secondAcct)
        assert.equal(accounts.length, 2)

        return keyring.serialize()
      }).then((serialized) => {
        assert.equal(serialized.mnemonic, sampleMnemonic)
        done()
      })
    })
  })

  describe('#addAccounts', function() {
    describe('with no arguments', function() {
      it('creates a single wallet', function(done) {
        keyring.addAccounts()
        .then(() => {
          assert.equal(keyring.wallets.length, 1)
          done()
        })
      })
    })

    describe('with a numeric argument', function() {
      it('creates that number of wallets', function(done) {
        keyring.addAccounts(3)
        .then(() => {
          assert.equal(keyring.wallets.length, 3)
          done()
        })
      })
    })
  })

  describe('#getAccounts', function() {
    it('calls getAddress on each wallet', function(done) {
      // Push a mock wallet
      const desiredOutput = 'foo'
      keyring.wallets.push({
        defaultAddress: {
          base58: desiredOutput,
        }
      })

      const output = keyring.getAccounts()
      .then((output) => {
        assert.equal(output[0], desiredOutput)
        assert.equal(output.length, 1)
        done()
      })
    })
  })

  /*
  describe('#signPersonalMessage', function () {
    it('returns the expected value', function (done) {
      const address = firstAcct
      const privateKey = new Buffer(privKeyHex, 'hex')
      const message = '0x68656c6c6f20776f726c64'

      keyring.deserialize({
        mnemonic: sampleMnemonic,
        numberOfAccounts: 1,
      })
      .then(() => {
        return keyring.signPersonalMessage(address, message)
      })
      .then((sig) => {
        assert.notEqual(sig, message, 'something changed')

        const restored = sigUtil.recoverPersonalSignature({
          data: message,
          sig,
        })

        assert.equal(restored, sigUtil.normalize(address), 'recovered address')
        done()
      })
      .catch((reason) => {
        console.error('failed because', reason)
      })
    })
  })

  */
  describe('#signTransaction', function () {
    it('returns the expected value', function (done) {
      const address = firstAcct
      const tx = {
        txID: '6f2870a5fdef530e9573006eae61974769dbddb399cca79ec7b60c25f443880f',
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  amount: 1000,
                  owner_address: hexAddress,
                  to_address: "41e552f6487585c2b58bc2c9bb4492bc1f17132cd0",
                },
                type_url: "type.googleapis.com/protocol.TransferContract"
              },
              type: "TransferContract"
            }
          ],
          ref_block_bytes: "267e",
          ref_block_hash: "9a447d222e8de9f2",
          expiration: 1530893064000,
          timestamp: 1530893006233,
        }
      }
      const expSig = '974e8401431a7ae2515f42868ea7c8838e3c745c087efe9dce5fa491257f4479f06fa0f6feffc96c653cebe67d10c375d13caee4374c430b7cd66d8dd35e471701'
      keyring.deserialize({ mnemonic: sampleMnemonic, numberOfAccounts: 1 }).then(function () {
        return keyring.signTransaction(address, tx)
      }).then(function (sig) {
        assert.equal(expSig, sig.signature[0])
        done()
      }).catch(function (reason) {
        console.error('failed because', reason)
      })
    })
  })

  /*
  describe('custom hd paths', function () {

    it('can deserialize with an hdPath param and generate the same accounts.', function (done) {
      const hdPathString = `m/44'/60'/0'/0`
      const sampleMnemonic = 'finish oppose decorate face calm tragic certain desk hour urge dinosaur mango'

      keyring.deserialize({
        mnemonic: sampleMnemonic,
        numberOfAccounts: 1,
        hdPath: hdPathString,
      })
      .then(() => {
        return keyring.getAccounts()
      })
      .then((addresses) => {
        assert.equal(addresses[0], firstAcct)
        return keyring.serialize()
      })
      .then((serialized) => {
        assert.equal(serialized.hdPath, hdPathString)
        done()
      })
      .catch((reason) => {
        console.error('failed because', reason)
      })
    })

    it('can deserialize with an hdPath param and generate different accounts.', function (done) {
      const hdPathString = `m/44'/60'/0'/1`
      const sampleMnemonic = 'finish oppose decorate face calm tragic certain desk hour urge dinosaur mango'

      keyring.deserialize({
        mnemonic: sampleMnemonic,
        numberOfAccounts: 1,
        hdPath: hdPathString,
      })
      .then(() => {
        return keyring.getAccounts()
      })
      .then((addresses) => {
        assert.notEqual(addresses[0], firstAcct)
        return keyring.serialize()
      })
      .then((serialized) => {
        assert.equal(serialized.hdPath, hdPathString)
        done()
      })
      .catch((reason) => {
        console.log('failed because', reason)
      })
    })
  })

  describe('create and restore 1k accounts', function () {
    it('should restore same accounts with no problem', async function () {
      this.timeout(20000)

      for (let i = 0; i < 1e3; i++) {

        keyring = new HdKeyring({
          numberOfAccounts: 1,
        })
        const originalAccounts = await keyring.getAccounts()
        const serialized = await keyring.serialize()
        const mnemonic = serialized.mnemonic

        keyring = new HdKeyring({
          numberOfAccounts: 1,
          mnemonic,
        })
        const restoredAccounts = await keyring.getAccounts()

        const first = originalAccounts[0]
        const restored = restoredAccounts[0]
        const msg = `Should restore same account from mnemonic: "${mnemonic}"`
        assert.equal(restoredAccounts[0], originalAccounts[0], msg)

      }

      return true
    })
  })
  */
})

