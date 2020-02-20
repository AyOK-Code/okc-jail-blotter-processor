const fs = require('fs')
const { promisify } = require('util')
const pdf = require('pdf-parse')
const { ParsingError, parsers: p, combinators: c, mappers: m, parse } = require('./parser-combinators')

const regexes = {
  name: new RegExp('^([^,]+), (.+)$'),
  bookingNumber: new RegExp('^(B-[0-9]{7})$'),
  inmateNumber: new RegExp('^(IN-[0-9]{7})$'),
  date: new RegExp('^([1-9]|1(?:[0-2]))/([1-9]|(?:[1-2][0-9])|(?:3[0-1]))/((?:(?:19)|(?:20))[0-9]{2})$'),
  dateTime: new RegExp('^([1-9]|1(?:[0-2]))/([1-9]|(?:[1-2][0-9])|(?:3[0-1]))/((?:(?:19)|(?:20))[0-9]{2}) ([1-9]|(?:1[0-2])):([0-5][0-9]):([0-5][0-9]) ((?:A|P)M)$'),
  pageNumber: new RegExp('^(Page [1-9][0-9]* of [1-9][0-9]*)$'),
  printDate: new RegExp('^((?:[1-9]|1(?:[0-2]))/(?:[1-9]|(?:[1-2][0-9])|(?:3[0-1]))/(?:(?:19)|(?:20))[0-9]{2} (?:[1-9]|(?:1[0-2])):[0-5][0-9] (?:A|P)M)$'),
  integer: new RegExp('^([1-9][0-9]*)$'),
  money: new RegExp('^\\$([0-9,]+\\.[0-9]{2})$'),
  code: new RegExp('^([A-Z0-9 ./-]+)$'),
  type: new RegExp('^([A-Z]{2})$'),
  zip: new RegExp('([0-9]{5}(?:\\-[0-9]+)*)$')
}

const squish = (s) => s.replace(/\s+/g, ' ').trim()

const selectors = {
  text: (expected) => (s, field) => {
    if (s !== expected) {
      throw new ParsingError(`Invalid text at ${field}: ${JSON.stringify(s)}, expected ${JSON.stringify(expected)}`)
    }
    return { [field]: s }
  },
  oneOf: (...values) => (s, field) => {
    if (!values.includes(s)) {
      throw new ParsingError(`Invalid value at ${field}: ${JSON.stringify(s)}, but expected one of: ${values.join(', ')}`)
    }
    return { [field]: s }
  },
  pattern: (regex) => (s, field) => {
    const selected = s.match(regex)
    if (selected == null) {
      throw new ParsingError(`Invalid pattern at ${field}: ${JSON.stringify(s)}`)
    }
    return { [field]: squish(selected[1]) }
  },
  name: (s, field) => {
    const selected = s.match(regexes.name)
    if (selected == null) {
      throw new ParsingError(`Invalid name at ${field}: ${JSON.stringify(s)}`)
    }
    const [, last, first] = selected
    return { lastName: squish(last), firstName: squish(first) }
  },
  freeform: (s, field) => {
    return { [field]: squish(s) }
  },
  date: (s, field) => {
    const selected = s.match(regexes.date)
    if (selected == null) {
      throw new ParsingError(`Invalid date at ${field}: ${JSON.stringify(s)}`)
    }
    const [, month, day, year] = selected
    return { [field]: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` }
  },
  dateTime: (s, field) => {
    const selected = s.match(regexes.dateTime)
    if (selected == null) {
      throw new ParsingError(`Invalid datetime at ${field}: ${JSON.stringify(s)}`)
    }
    const [, month, day, year, hourUs, minute, second, ampm] = selected
    const hourZero = hourUs === '12' ? '0' : hourUs
    const hour = ampm === 'PM' ? (~~hourZero + 12).toString() : hourZero
    return { [field]: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}` }
  }
}

const startsAt = (v) => (x, r, t) => x === v
const endsAt = (v) => (x, r, t) => t === v
const centeredOn = (v) => (x, r, t) => r === v

const fields = {
  // Fixed
  nameLabel: { vx: startsAt(40), selector: selectors.text('Name:') },
  name: { vx: startsAt(88), selector: selectors.name },
  bookingNumberLabel: { vx: startsAt(430), selector: selectors.text('Booking #:') },
  bookingNumber: { vx: startsAt(522), selector: selectors.pattern(regexes.bookingNumber) },
  addressLabel: { vx: startsAt(40), selector: selectors.text('Address:') },
  address: { vx: startsAt(89), selector: selectors.freeform },
  inmateNumberLabel: { vx: startsAt(438), selector: selectors.text('Inmate #:') },
  inmateNumber: { vx: startsAt(518), selector: selectors.pattern(regexes.inmateNumber) },
  sexLabel: { vx: startsAt(40), selector: selectors.text('Sex:') },
  sex: { vx: centeredOn(175), selector: selectors.oneOf('M', 'F', 'U') },
  raceLabel: { vx: startsAt(118), selector: selectors.text('Race:') },
  race: { vx: centeredOn(326), selector: selectors.oneOf('W', 'B', 'I', 'U', 'A', 'P') },
  dobLabel: { vx: startsAt(246), selector: selectors.text('DOB:') },
  dob: { vx: centeredOn(605), selector: selectors.date },
  bookingTypeLabel: { vx: startsAt(413), selector: selectors.text('Booking Type:') },
  bookingType: { vx: endsAt(570), selector: selectors.oneOf('INITIAL BOOKING', 'RE-BOOKING') },
  bookingDateLabel: { vx: startsAt(40), selector: selectors.text('Booking Date:') },
  bookingDate: { vx: startsAt(117), selector: selectors.dateTime },
  releaseDateLabel: { vx: startsAt(246), selector: selectors.text('Release Date:') },
  releaseDate: { vx: startsAt(318), selector: selectors.dateTime },
  // Table header
  dispoHeader: { vx: startsAt(535), selector: selectors.text('Dispo') },
  chargeHeader: { vx: startsAt(259), selector: selectors.text('Charge') },
  codeHeader: { vx: startsAt(195), selector: selectors.text('Code') },
  bondHeader: { vx: startsAt(483), selector: selectors.text('Bond') },
  typeHeader: { vx: startsAt(42), selector: selectors.text('Type') },
  citationNumberHeader: { vx: startsAt(70), selector: selectors.text('Citation #') },
  warrantNumberHeader: { vx: startsAt(132), selector: selectors.text('Warrant #') },
  // Table rows
  type: { vx: startsAt(42), selector: selectors.pattern(regexes.type) },
  bond: { vx: endsAt(522), selector: selectors.pattern(regexes.money) },
  code: { vx: startsAt(195), selector: selectors.pattern(regexes.code) },
  dispo: { vx: centeredOn(1099), selector: selectors.freeform },
  charge: { vx: startsAt(259), selector: selectors.freeform },
  warrantNumber: { vx: startsAt(132), selector: selectors.pattern(regexes.code) },
  citationNumber: { vx: startsAt(70), selector: selectors.pattern(regexes.code) },
  // Page header
  subTitle: { vx: startsAt(150), selector: selectors.text('Inmates with an Intake Date between:') },
  headerDateTime: { vx: centeredOn(619), selector: selectors.dateTime },
  title: { vx: startsAt(169), selector: selectors.text('Oklahoma City Jail Blotter') },
  subTitleDateFrom: { vx: endsAt(384), selector: selectors.date },
  subTitleDateTo: { vx: startsAt(412), selector: selectors.date },
  subTitleDatesAnd: { vx: startsAt(390), selector: selectors.text('and') },
  // Page footer
  pageNumber: { vx: startsAt(226), selector: selectors.pattern(regexes.pageNumber) },
  printDate: { vx: endsAt(496), selector: selectors.pattern(regexes.printDate) },
  totalInmatesLabel: { vx: startsAt(37), selector: selectors.text('Total Number of Inmates:') },
  totalInmates: { vx: startsAt(154), selector: selectors.pattern(regexes.integer) }
}

const take = (field) => c.log(p.satisfy(({ s, left, center, right }) => {
  const { vx, selector } = fields[field]
  const capture = selector(s, field)
  if (!vx(left, center, right)) {
    throw new ParsingError(`Invalid x-coordinates for ${field}: ${JSON.stringify(left, center, right)}`)
  }
  return capture
}), field)

async function tokenize (buf) {
  const tokens = []

  await pdf(buf, {
    pagerender: async (raw) => {
      const data = await raw.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false
      })
      data.items.forEach((data, i, arr) => {
        const { str, transform, width } = data
        const x = transform[4]
        const w = width
        const left = ~~x
        const center = ~~(x + x + w)
        const right = ~~(x + w)
        tokens.push({ s: str, left, center, right })
      })
    }
  })

  return tokens
}

/* FILTER GRAMMAR */
const chargeTableHeaders = c.merge([
  m.ignore(take('dispoHeader')),
  m.ignore(take('chargeHeader')),
  m.ignore(take('codeHeader')),
  m.ignore(take('bondHeader')),
  m.ignore(take('typeHeader')),
  m.ignore(take('citationNumberHeader')),
  m.ignore(take('warrantNumberHeader'))
])

const documentHeaders = c.merge([
  m.ignore(take('subTitle')),
  m.ignore(take('headerDateTime')),
  m.ignore(take('title')),
  m.ignore(take('subTitleDateFrom')),
  m.ignore(take('subTitleDatesAnd')),
  m.ignore(take('subTitleDateTo'))
])

const filterTokensGrammar = c.many1('data',
  c.merge([
    m.ignore(
      c.many('metadata',
        c.first([
          m.ignore(take('pageNumber')),
          m.ignore(take('printDate')),
          chargeTableHeaders,
          documentHeaders
        ])
      )
    ),
    c.first([
      p.accept,
      p.eof
    ])
  ])
)

/* JAIL BLOTTER GRAMMAR */
const fixedFields = c.merge([
  m.ignore(take('nameLabel')),
  m.ignore(take('sexLabel')),
  m.ignore(take('raceLabel')),
  c.maybe(take('dob')),
  take('sex'),
  take('name'),
  take('race'),
  m.ignore(take('bookingNumberLabel')),
  take('bookingNumber'),
  m.ignore(take('dobLabel')),
  m.ignore(take('addressLabel')),
  m.ignore(take('bookingDateLabel')),
  m.ignore(take('releaseDateLabel')),
  m.ignore(take('inmateNumberLabel')),
  take('bookingDate'),
  c.maybe(take('releaseDate')),
  take('inmateNumber'),
  c.map(
    m.join('address', take('address')),
    ({ address }) => {
      const selected = address.match(regexes.zip)
      return selected == null ? { address } : { address, zip: selected[1] }
    }
  ),
  c.maybe(take('bookingType')),
  m.ignore(take('bookingTypeLabel'))
])

const charge = c.log(c.merge([
  take('type'),
  c.maybe(take('bond')),
  c.map(
    m.join1('code', take('code')),
    ({ code }) => ({ code: code.replace(/ /g, '') })
  ),
  c.maybe(take('dispo')),
  m.join1('charge', take('charge')),
  c.maybe(c.map(
    m.join1('warrantNumber', take('warrantNumber')),
    ({ warrantNumber: x }) => ({
      warrantNumber: x.replace(/([^0-9A-Za-z]) /g, (...m) => m[1])
    })
  )),
  c.maybe(take('citationNumber')),

  // page wrap in the middle of multiline will repeat code and part of charge
  m.ignore(c.maybe(c.many1('code wrap', take('code')))),
  m.ignore(c.maybe(c.many1('charge wrap', take('charge'))))

]), 'charge row')

const endOfDocument = c.merge([
  m.ignore(take('totalInmatesLabel')),
  m.ignore(take('totalInmates'))
])

const grammar = c.merge([
  c.many1('rows',
    c.merge([
      fixedFields,
      c.many1('charges', charge)
    ])
  ),
  endOfDocument
])

exports.parseJailblotter = async function (buf, debug = true) {
  const t0 = Date.now()
  const allText = await tokenize(buf)
  const tExtractText = Date.now()
  const { data: tokens } = parse(filterTokensGrammar, allText).data
  const tFilterTokens = Date.now()

  if (debug) {
    await promisify(fs.writeFile)('./tokens.txt', tokens.map((x) => JSON.stringify(x)).join('\n'))
  }

  const log = []
  try {
    const { data: parsed } = parse(grammar, tokens, log)
    if (debug) {
      await promisify(fs.writeFile)('./parsed.json', JSON.stringify(parsed, null, 2))
    }

    const extractText = tExtractText - t0
    const filterTokens = tFilterTokens - tExtractText
    const parseBlotter = Date.now() - tFilterTokens
    return {
      timings: {
        extractText,
        filterTokens,
        parseBlotter,
        total: extractText + filterTokens + parseBlotter
      },
      tokens,
      log,
      parsed
    }
  } catch (err) {
    log.slice(-50).forEach((x) => console.error(x))
    throw err
  }
}
