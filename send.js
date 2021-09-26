import fs from 'fs'
import { importKey } from '@taquito/signer'
import { TezosToolkit } from '@taquito/taquito'
import {
  AIRDROP_ADMIN,
  IDZ_CONTRACT,
  TEZOS_RPC,
} from './config.js'

const FAUCET_KEY = JSON.parse(fs.readFileSync(`../tezid-secrets/${AIRDROP_ADMIN}.json`).toString())
const tezos = new TezosToolkit(TEZOS_RPC)
importKey(tezos,
  FAUCET_KEY.email,
  FAUCET_KEY.password,
  FAUCET_KEY.mnemonic.join(' '),
  FAUCET_KEY.secret
).catch((e) => console.error(e))

const weighted = JSON.parse(fs.readFileSync('weighted.json'))
const batchSize = 500

function storeWeighted() {
  fs.writeFileSync('weighted.json', JSON.stringify(weighted))
  fs.writeFileSync('weighted-backup.json', JSON.stringify(weighted))
}
function getWeightedList() {
  return Object.keys(weighted).map(address => {
    let list = weighted[address]
    list.address = address
    return list
  })
}

export async function sleep(seconds) {
  await new Promise(resolve => setTimeout(resolve, seconds*1000))
}

async function send() {
  const notSendt = getWeightedList().filter(w => !w.transferred)  
  console.log('Not sendt', notSendt.length)
  const batch = notSendt.splice(0,batchSize)
  try {
    await sleep(3)

    batch.forEach(b => {
      weighted[b.address].transferred = true
    })
    storeWeighted()
    const stillNotSendt = getWeightedList().filter(w => !w.transferred)
    console.log('Still not sendt', stillNotSendt.length)
    if (stillNotSendt.length > 0) await send()
  } catch(err) {
    throw err
  }
}

send()
