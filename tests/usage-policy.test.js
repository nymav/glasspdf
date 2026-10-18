import test from 'node:test'
import assert from 'node:assert/strict'
import { readUsage, recordExport, remainingExports, FREE_PLAN } from '../src/lib/usagePolicy.js'
const memory = () => { const data = new Map(); return { getItem:k=>data.get(k), setItem:(k,v)=>data.set(k,v) } }
test('five exports exhaust the free allowance', () => {
 const storage = memory(), date = new Date(2026,9,19,12)
 assert.equal(remainingExports(readUsage(storage,date)),5)
 for(let i=0;i<5;i++)recordExport(storage,date)
 assert.equal(remainingExports(readUsage(storage,date)),0)
 assert.equal(FREE_PLAN.maxFileBytes,25*1024*1024)
})
test('allowance resets on next local calendar day', () => {
 const storage = memory();recordExport(storage,new Date(2026,9,19,23,59))
 assert.equal(readUsage(storage,new Date(2026,9,20,0,0)).exports,0)
})
test('corrupt storage falls back without crashing', () => {
 assert.equal(readUsage({getItem:()=>'{broken'}).exports,0)
})
