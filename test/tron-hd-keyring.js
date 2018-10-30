const assert = require('assert')
const HdKeyring = require('../tron-hd-keyring')

const sampleMnemonic = 'decline rice regret twice apple unknown melt puzzle spot echo banana tornado mountain text output arrive tomorrow flat oppose scrub bless impact hockey recycle'
const firstAcct = 'TDKcAPfAu42Js6dqirkUcfos9S9pPzoCbh'
const secondAcct = 'TJXW2Apt9UboV1VCyWoutjQBNtTGaJSmrh'

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
})

