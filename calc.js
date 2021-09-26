import fs from 'fs'

const snapshot = JSON.parse(fs.readFileSync('./snapshot.json').toString())
const totalIdz = 50000 // NOTE: Make sure to keep 1 for rounding diffs 
const announceDate = new Date(Date.UTC(2021, 7, 26, 0, 0))
const snapshotDate = new Date(Date.UTC(2021, 8, 12, 14, 0))
const UNVERIFIED_WEIGHT = 1
const VERIFIED_WEIGHT = 4
const EARLY_ADOPTER_BONUS = 2
const DECIMALS = 8
const nonParticipants = ['tz1iAAJhH465Cf3BnsKQ744XHypQGY1v7Ps9']

const weighted = Object.keys(snapshot).reduce((_weighted, address) => {
  if (nonParticipants.indexOf(address) >= 0) return _weighted
  const proofs = snapshot[address]
  let weight = Object.values(proofs).reduce((_weight, proof) => {
    let proofWeight = 0
    if (new Date(proof.register_date) <= snapshotDate) {
      let earlyAdopterBonus = new Date(proof.register_date) <= announceDate ? EARLY_ADOPTER_BONUS : 0
      proofWeight = (proof.verified ? VERIFIED_WEIGHT : UNVERIFIED_WEIGHT) + earlyAdopterBonus
    }
    return _weight + proofWeight
  },0)
  if (weight > 0) _weighted[address] = { weight: weight }
  return _weighted
}, {})

const totalWeight = Object.values(weighted).reduce((total, data) => {
  return total + data.weight
},0)

const tokenWeight = parseFloat((totalIdz / totalWeight).toFixed(DECIMALS))

Object.keys(weighted).forEach(address => {
  let data = weighted[address]
  data.tokens = data.weight * tokenWeight
  data.transferred = false
})

fs.writeFileSync('weighted.json', JSON.stringify(weighted))
//console.log(weighted)
//console.log(Object.keys(weighted).length)
