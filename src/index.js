const fs = require('fs')
const { promisify } = require('util')
const moment = require('moment')
const { parseJailblotter } = require('./parsing/jail-blotter')
const { filterLinks, save } = require('./persist')
const { getLinks, fetchPdf } = require('./fetch')
const Bottleneck = require('bottleneck')
const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 1000 })

async function main () {
  const pdfs = await (async () => {
    if (process.argv[2] != null) {
      const buf = await promisify(fs.readFile)(process.argv[2])
      return [{ buf, postedOn: moment().format('YYYY-MM-DD') }]
    } else {
      const links = await getLinks()
      console.log(`Found ${links.length} PDF links.`)

      const validLinks = await filterLinks(links)
      const pdfs = await Promise.all(
        validLinks.map((x) =>
          limiter.schedule(async ({ href, postedOn }) => {
            console.log(`Fetching ${href} (${postedOn})`)
            const buf = await fetchPdf(href)
            return { buf, postedOn }
          }, x)
        )
      )
      return pdfs
    }
  })()

  const processed = await Promise.all(pdfs.map(async ({ buf, postedOn }) => {
    const { parsed, timings: { extractText, filterTokens, parseBlotter, total } } = await parseJailblotter(buf)
    console.log(`Parsed ${parsed.rows.length} entries in ${total}ms (${extractText}+${filterTokens}+${parseBlotter})`)
    return { rows: parsed.rows, postedOn }
  }))

  await save(processed)
  console.log('Done')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
