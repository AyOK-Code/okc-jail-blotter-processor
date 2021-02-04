const fs = require('fs')
const { promisify } = require('util')
const moment = require('moment')
const { parseJailblotter, anonymizeRow } = require('./parsing/jail-blotter')
const { filterLinks, save } = require('./persist')
const { getLinks, fetchPdf } = require('./fetch')
const raygun = require('raygun')
const raygunClient = new raygun.Client().init({ apiKey: process.env.RAYGUN_API_KEY })
const Bottleneck = require('bottleneck')
const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 1000 })
limiter.on('error', (e) => raygunClient.send(e))
const express = require('express')
const bodyParser = require('body-parser')

function errorHandler (e, userCb) {
  const cb = () => {
    console.error(e)
    userCb()
  }
  if (process.env.RAYGUN_API_KEY != null) {
    raygunClient.send(e, {}, cb)
  } else {
    cb()
  }
}

async function run (file, command) {
  const pdfs = await (async () => {
    if (file != null) {
      const buf = await promisify(fs.readFile)(file)
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
    console.log(`${postedOn} Parsed ${parsed.rows.length} entries in ${total}ms (${extractText}+${filterTokens}+${parseBlotter})`)
    return { rows: parsed.rows, postedOn }
  }))

  if (file != null && command === 'update') {
    processed[0].rows.forEach(anonymizeRow)
    const target = file.replace(/[.]pdf$/, '.json')
    await promisify(fs.writeFile)(target, JSON.stringify({ rows: processed[0].rows }, null, 2))
    console.log(`Updated ${target}`)
  } else if (file == null || (file != null && command === 'save')) {
    await save(processed)
  }

  console.log('Done')
}

const [, , file, command] = process.argv
if (file == null) {
  if (process.env.PORT == null) {
    throw new Error('The PORT environment variable is undefined')
  }
  if (process.env.AUTH_TOKEN == null) {
    throw new Error('The AUTH_TOKEN environment variable is undefined')
  }
  const app = express()
  app.use(bodyParser.json({ limit: '10Mb', type: '*/*' }))
  app.post('/run', async function (req, res, next) {
    try {
      if (req.body.token !== process.env.AUTH_TOKEN) {
        console.log(`403. Invalid auth token: ${req.body.token}`)
        res.status(403).send({ message: 'Invalid auth token' })
      } else {
        await run()
        res.status(200).send()
      }
    } catch (e) {
      errorHandler(e, () => res.status(500).send())
    }
  })

  app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send({ message: err.message })
    raygunClient.send(err, {}, (response) => {}, req)
  })
  app.listen(
    process.env.PORT,
    () => console.log(`Started on port ${process.env.PORT}`)
  )
} else {
  run(file, command).catch((e) => errorHandler(e, () => process.exit(1)))
}
