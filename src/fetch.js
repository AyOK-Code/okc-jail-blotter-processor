const cheerio = require('cheerio')
const axios = require('axios')
const moment = require('moment')

const client = axios.create({
  baseURL: 'https://www.okc.gov',
  timeout: 30 * 1000
})

exports.getLinks = async function () {
  const res = await client.get('/departments/police/crime-prevention-data/jail-blotter')
  if (res.status !== 200) {
    console.error(res.headers)
    throw new Error(`Got HTTP ${res.status} (${res.statusText}) when attempting to fetch new PDFs.`)
  }

  const $ = cheerio.load(res.data)
  const links = $('.document_widget a').toArray()
    .map(({ attribs, children }) => ({
      href: attribs != null ? attribs.href : null,
      date: (children != null ? children : [])
        .filter(({ type, data }) => type === 'text')
        .map(({ data }) => moment(data, 'MMM D, YYYY'))[0]
    }))
    .filter(({ href, date }) => date.isValid())
  return links
}

const drain = (stream) => new Promise((resolve, reject) => {
  const chunks = []
  const onData = (chunk) => chunks.push(chunk)
  const onEnd = (...args) => resolve(Buffer.concat(chunks))
  const onError = (err) => {
    stream.removeListener(onData)
    stream.removeListener(onEnd)
    return reject(err)
  }
  stream.on('data', onData)
  stream.on('end', onEnd)
  stream.on('error', onError)
})

exports.fetchPdf = async function (href) {
  const res = await client.get(href, {
    responseType: 'stream'
  })
  if (res.status !== 200) {
    console.error(res.headers)
    throw new Error(`Got HTTP ${res.status} (${res.statusText}) when attempting to fetch ${href}`)
  }

  return drain(res.data)
}
