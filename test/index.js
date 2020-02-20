/* eslint-env mocha */

const fs = require('fs')
const { promisify } = require('util')
const assert = require('assert')
const { parseJailblotter, anonymizeRow } = require('../src/parsing/jail-blotter')

async function main () {
  const files = await promisify(fs.readdir)(`${__dirname}/fixtures`)
  const jsons = files.filter((x) => x.endsWith('.json')).reduce((acc, x) => acc.add(x), new Set())
  const pdfs = files.filter((x) => x.endsWith('.pdf')).sort()

  describe('Parse Jail Blotter PDFs', function () {
    pdfs.forEach(function (pdf) {
      const json = pdf.replace('.pdf', '.json')
      if (jsons.has(json)) {
        it(`Validates ${pdf} against ${json}`, async function () {
          const bufPdf = await promisify(fs.readFile)(`${__dirname}/fixtures/${pdf}`)
          const bufJson = await promisify(fs.readFile)(`${__dirname}/fixtures/${json}`)
          const { parsed } = await parseJailblotter(bufPdf, false)
          parsed.rows.forEach(anonymizeRow)
          assert.deepStrictEqual(parsed, JSON.parse(bufJson.toString('utf8')))
        })
      } else {
        it(`Successfully parses ${pdf}`, async function () {
          const buf = await promisify(fs.readFile)(`${__dirname}/fixtures/${pdf}`)
          await parseJailblotter(buf, false)
        })
      }
    })
  })
  run()
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
