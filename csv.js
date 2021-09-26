import fs from 'fs'

const transfered = JSON.parse(fs.readFileSync('transfered.json'))
const csvFileName = 'transfered.csv'

fs.writeFileSync(csvFileName, 'address,weight,idz,transaction\n')

Object.values(transfered).forEach(t => {
  fs.appendFileSync(csvFileName, `${t.address},${t.weight},${t.tokens},${t.transaction}\n`)
})
