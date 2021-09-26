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
  FAUCET_KEY.privkey
).catch((e) => console.error(e));

const weighted = JSON.parse(fs.readFileSync('weighted.json'))
const batchSize = 300

function storeWeighted() {
  fs.writeFileSync('weighted.json', JSON.stringify(weighted))
//  fs.writeFileSync('backup.json', JSON.stringify(weighted))
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
    let transferList = batch.map(receiver => {
      return {
        from_: AIRDROP_ADMIN, 
        txs: [
          {
            to_: receiver.address, 
            token_id: 0,
            amount: Math.trunc(receiver.tokens * 10**8) 
          }
        ]
      }
    })
    let contract = await tezos.contract.at(IDZ_CONTRACT)

    let estimateOp = await contract.methods.transfer(transferList).toTransferParams({})
    let { gasLimit, storageLimit, suggestedFeeMutez } = await tezos.estimate.transfer(estimateOp)
    let op = await contract.methods.transfer(transferList).send({
      fee: suggestedFeeMutez,
      gasLimit: gasLimit,
      storageLimit: storageLimit
    })

    //let op = await contract.methods.transfer(transferList).send()

    await op.confirmation(1)
    console.log(op.hash)
    batch.forEach(b => {
      weighted[b.address].transferred = true
      weighted[b.address].transaction = op.hash 
    })
    storeWeighted()
    const stillNotSendt = getWeightedList().filter(w => !w.transferred)
    await sleep(30)
    if (stillNotSendt.length > 0) await send()
  } catch(err) {
    console.error(err)
  }
}

send()
