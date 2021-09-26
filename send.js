import fs from 'fs'

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
