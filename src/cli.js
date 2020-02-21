const fs = require('fs')
const { promisify } = require('util')
const moment = require('moment')
const { parseJailblotter } = require('./parsing/jail-blotter')
const { save } = require('./persist')
const config = require('./config/config').development

const { getLinks, fetchPdf } = require('./fetch')

async function main () {
  const { buf, postedOn } = await ((async () => {
    if (process.argv[2] != null) {
      const buf = await promisify(fs.readFile)(process.argv[2])
      return { buf, postedOn: moment() }
    } else {
      const links = await getLinks()
      console.log(`Found ${links.length} PDF links.`)
      console.log(`Fetching ${links[0].href} (${links[0].date.format('MMM D, YYYY')})`)
      const buf = await fetchPdf(links[0].href)
      return { buf, postedOn: links[0].date }
    }
  })())

  const { parsed, timings: { extractText, filterTokens, parseBlotter, total } } = await parseJailblotter(buf)
  console.log(`Parsed ${parsed.rows.length} entries in ${total}ms (${extractText}+${filterTokens}+${parseBlotter})`)
  await save(config, parsed, postedOn)
  console.log('Done')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
