# Tron Keyring Controller

A module for managing groups of Tron accounts called "Keyrings", defined originally for MegTron and MetaMask's multiple-account-type feature.
Forked from MetaMask/KeyringController.

To add new account types to a `TronKeyringController`, just make sure it follows [The Keyring Class Protocol](./docs/keyring.md).

The TronKeyringController has three main responsibilities:
- Initializing & using (signing with) groups of Tron accounts ("keyrings").
- Keeping track of local nicknames for those individual accounts.
- Providing password-encryption persisting & restoring of secret information.

## Installation

`npm install https://github.com/MegTron/TronKeyringController.git --save`

## Usage

```javascript
const KeyringController = require('tron-keyring-controller')
const SimpleKeyring = require('tron-simple-keyring')

const keyringController = new KeyringController({
  keyringTypes: [SimpleKeyring], // optional array of types to support.
  initState: initState.KeyringController, // Last emitted persisted state.
  encryptor: { // An optional object for defining encryption schemes:
               // Defaults to Browser-native SubtleCrypto.
    encrypt (password, object) {
      return new Promise('encrypted!')
    },
    decrypt (password, encryptedString) {
      return new Promise({ foo: 'bar' })
    },
  },
})

// The TronKeyringController is also an event emitter:
this.keyringController.on('newAccount', (address) => {
  console.log(`New account created: ${address}`)
})
this.keyringController.on('removedAccount', handleThat)
```

