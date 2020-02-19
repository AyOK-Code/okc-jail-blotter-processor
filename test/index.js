/* eslint-env mocha */

const fs = require('fs')
const { promisify } = require('util')

const { parseJailblotter } = require('../src/parsing/jail-blotter')

describe('Parse Jail Blotter PDFs', async function () {
  (await promisify(fs.readdir)(`${__dirname}/fixtures`))
    .filter((x) => x.endsWith('.pdf'))
    .sort()
    // .slice(0, 1)
    .forEach(function (fixture) {
      it(`Successfully parses ${fixture}`, async function () {
        const buf = await promisify(fs.readFile)(`${__dirname}/fixtures/${fixture}`)
        const parsed = await parseJailblotter(buf, false)
        // console.log(Object.keys(parsed))
      })
    })

  run()
})
