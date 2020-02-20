const fs = require('fs')
const { promisify } = require('util')
const { parseJailblotter } = require('./parsing/jail-blotter')
const { save } = require('./persist')
const config = require('./config/config').development

async function main () {
  const buf = await promisify(fs.readFile)(process.argv[2])
  const { parsed, timings: { extractText, filterTokens, parseBlotter, total } } = await parseJailblotter(buf)
  console.log(`Successfully parsed ${parsed.rows.length} entries in ${total}ms (${extractText}+${filterTokens}+${parseBlotter})`)
  await save(config, parsed)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
