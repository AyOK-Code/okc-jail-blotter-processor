const fs = require('fs')
const { promisify } = require('util')
const { parseJailblotter } = require('./parsing/jail-blotter')
const { save } = require('./persist')
const config = require('./config/config').development

const { getLinks, fetchPdf } = require('./fetch')

async function main () {
  const buf = await (
    process.argv[2] != null
      ? promisify(fs.readFile)(process.argv[2])
      : (async () => {
        const links = await getLinks()
        console.log(`Found ${links.length} PDF links.`)
        console.log(`Fetching ${links[0].href} (${links[0].date.format('MMM D, YYYY')})`)
        return fetchPdf(links[0].href)
      })()
  )

  const { parsed, timings: { extractText, filterTokens, parseBlotter, total } } = await parseJailblotter(buf)
  console.log(`Parsed ${parsed.rows.length} entries in ${total}ms (${extractText}+${filterTokens}+${parseBlotter})`)
  await save(config, parsed)
  console.log('Done')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
