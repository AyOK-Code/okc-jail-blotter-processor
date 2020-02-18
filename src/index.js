const fs = require('fs')
const { promisify } = require('util')
const pdf = require('pdf-parse')

const { ParsingError, p, c, parse } = require('./parser-combinators')

const regexes = {
  name: new RegExp('^([^,]+), (.+)$'),
  bookingNumber: new RegExp('^B-[0-9]{7}$'),
  inmateNumber: new RegExp('^IN-[0-9]{7}$'),
  date: new RegExp('^([1-9]|1(?:[0-2]))/([1-9]|(?:[1-2][0-9])|(?:3[0-1]))/((?:(?:19)|(?:20))[0-9]{2})$'),
  dateTime: new RegExp('^([1-9]|1(?:[0-2]))/([1-9]|(?:[1-2][0-9])|(?:3[0-1]))/((?:(?:19)|(?:20))[0-9]{2}) ([1-9]|(?:1[0-2])):([0-5][0-9]):([0-5][0-9]) ((?:A|P)M)$'),
  citationNumber: new RegExp('^[1-9][0-9]{7}(?:[0-9]|X)$'),
  warrantNumber: new RegExp('^[A-Z0-9]+(?:[ .-][A-Z0-9]+)*$'),
  pageNumber: new RegExp('^Page [1-9][0-9]* of [1-9][0-9]*$'),
  printDate: new RegExp('^(?:[1-9]|1(?:[0-2]))/(?:[1-9]|(?:[1-2][0-9])|(?:3[0-1]))/(?:(?:19)|(?:20))[0-9]{2} (?:[1-9]|(?:1[0-2])):[0-5][0-9] (?:A|P)M$'),
  integer: new RegExp('^[1-9][0-9]*$'),
  money: new RegExp('^\\$[1-9][0-9,]*\\.[0-9]{2}$'),
  code: new RegExp('^[A-Z0-9]+(?:[.-][A-Z0-9]+)*$')
}

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
    if (!regex.test(s)) {
      throw new ParsingError(`Invalid pattern at ${field}: ${JSON.stringify(s)}`)
    }
    return { [field]: s }
  },
  name: (s, field) => {
    const selected = s.match(regexes.name)
    if (selected == null) {
      throw new ParsingError(`Invalid name at ${field}: ${JSON.stringify(s)}`)
    }
    const [, lastName, firstName] = selected
    return { lastName, firstName }
  },
  freeform: (s, field) => {
    return { [field]: s.trim() }
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

const exactly = (expected) => (x) => expected === x
const between = (low, high) => (x) => x >= low && x <= high

const fields = {
  // Fixed
  nameLabel: { x: exactly(40), selector: selectors.text('Name:') },
  name: { x: exactly(88), selector: selectors.name },
  bookingNumberLabel: { x: exactly(430), selector: selectors.text('Booking #:') },
  bookingNumber: { x: exactly(522), selector: selectors.pattern(regexes.bookingNumber) },
  addressLabel: { x: exactly(40), selector: selectors.text('Address:') },
  address: { x: exactly(89), selector: selectors.freeform },
  inmateNumberLabel: { x: exactly(438), selector: selectors.text('Inmate #:') },
  inmateNumber: { x: exactly(518), selector: selectors.pattern(regexes.inmateNumber) },
  sexLabel: { x: exactly(40), selector: selectors.text('Sex:') },
  sex: { x: between(83, 84), selector: selectors.oneOf('M', 'F') },
  raceLabel: { x: exactly(118), selector: selectors.text('Race:') },
  race: { x: between(158, 162), selector: selectors.oneOf('W', 'B', 'I') },
  dobLabel: { x: exactly(246), selector: selectors.text('DOB:') },
  dob: { x: between(277, 283), selector: selectors.date },
  bookingTypeLabel: { x: exactly(413), selector: selectors.text('Booking Type:') },
  bookingType: { x: exactly(487), selector: selectors.oneOf('INITIAL BOOKING') },
  bookingDateLabel: { x: exactly(40), selector: selectors.text('Booking Date:') },
  bookingDate: { x: exactly(117), selector: selectors.dateTime },
  releaseDateLabel: { x: exactly(246), selector: selectors.text('Release Date:') },
  releaseDate: { x: exactly(318), selector: selectors.dateTime },
  // Table header
  dispoHeader: { x: exactly(535), selector: selectors.text('Dispo') },
  chargeHeader: { x: exactly(259), selector: selectors.text('Charge') },
  codeHeader: { x: exactly(195), selector: selectors.text('Code') },
  bondHeader: { x: exactly(483), selector: selectors.text('Bond') },
  typeHeader: { x: exactly(42), selector: selectors.text('Type') },
  citationNumberHeader: { x: exactly(70), selector: selectors.text('Citation #') },
  warrantNumberHeader: { x: exactly(132), selector: selectors.text('Warrant #') },
  // Table rows
  type: { x: exactly(42), selector: selectors.oneOf('SS', 'JD', 'CR', 'TR') },
  bond: { x: between(477, 494), selector: selectors.pattern(regexes.money) },
  code: { x: exactly(195), selector: selectors.pattern(regexes.code) },
  dispo: { x: between(534, 543), selector: selectors.freeform },
  charge: { x: exactly(259), selector: selectors.freeform },
  warrantNumber: { x: exactly(132), selector: selectors.pattern(regexes.warrantNumber) },
  citationNumber: { x: exactly(70), selector: selectors.pattern(regexes.citationNumber) },
  // Page header
  title: { x: exactly(169), selector: selectors.text('Oklahoma City Jail Blotter') },
  subTitle: { x: exactly(150), selector: selectors.text('Inmates with an Intake Date between:') },
  subTitleDateFrom: { x: exactly(339), selector: selectors.date },
  subTitleDateTo: { x: exactly(412), selector: selectors.date },
  subTitleDatesAnd: { x: exactly(390), selector: selectors.text('and') },
  headerDateTime: { x: exactly(259), selector: selectors.dateTime },
  // Page footer
  pageNumber: { x: exactly(226), selector: selectors.pattern(regexes.pageNumber) },
  printDate: { x: exactly(411), selector: selectors.pattern(regexes.printDate) },
  totalInmatesLabel: { x: exactly(37), selector: selectors.text('Total Number of Inmates:') },
  totalInmates: { x: exactly(154), selector: selectors.pattern(regexes.integer) }
}

const log = []
p.take = (field) => c.log(p.satisfy((data) => {
  const { x, selector } = fields[field]
  const capture = selector(data.s, field)
  if (!x(data.x)) {
    throw new ParsingError(`Invalid x-coordinate at ${field}: ${data.x}`)
  }
  return capture
}), log, field)

async function tokenize (buf) {
  const tokens = []

  await pdf(buf, {
    pagerender: async (raw) => {
      const data = await raw.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false
      })
      data.items.forEach(({ str, transform }, i, arr) => {
        tokens.push({ s: str, x: ~~transform[4] })
      })
    }
  })

  return tokens
}

function dropMetadata (tokens) {
  const grammar = c.many1('data',
    c.merge([
      c.ignore(
        c.many('metadata',
          c.first([
            p.take('pageNumber'),
            p.take('printDate'),
            c.merge([
              p.take('subTitle'),
              p.take('headerDateTime'),
              p.take('title'),
              p.take('subTitleDateFrom'),
              p.take('subTitleDatesAnd'),
              p.take('subTitleDateTo')
            ])
          ])
        )
      ),
      c.first([
        p.accept,
        p.eof
      ])
    ])
  )
  return parse(grammar, tokens).data
}

async function main () {
  const buf = await promisify(fs.readFile)(process.argv[2])
  const allTokens = await tokenize(buf)
  const tokens = dropMetadata(allTokens)
  await promisify(fs.writeFile)('./tokens.txt', tokens.map((x) => JSON.stringify(x)).join('\n'))
  const t0 = Date.now()

  /* Build grammar */
  const fixedFields = c.merge([
    c.ignore(p.take('nameLabel')),
    c.ignore(p.take('sexLabel')),
    c.ignore(p.take('raceLabel')),
    p.take('dob'),
    p.take('sex'),
    p.take('name'),
    p.take('race'),
    c.ignore(p.take('bookingNumberLabel')),
    p.take('bookingNumber'),
    c.ignore(p.take('dobLabel')),
    c.ignore(p.take('addressLabel')),
    c.ignore(p.take('bookingDateLabel')),
    c.ignore(p.take('releaseDateLabel')),
    c.ignore(p.take('inmateNumberLabel')),
    p.take('bookingDate'),
    c.maybe(p.take('releaseDate')),
    p.take('inmateNumber'),
    p.take('address'),
    p.take('bookingType'),
    c.ignore(p.take('bookingTypeLabel'))
  ])

  const chargeTableHeaders = c.merge([
    c.ignore(p.take('dispoHeader')),
    c.ignore(p.take('chargeHeader')),
    c.ignore(p.take('codeHeader')),
    c.ignore(p.take('bondHeader')),
    c.ignore(p.take('typeHeader')),
    c.ignore(p.take('citationNumberHeader')),
    c.ignore(p.take('warrantNumberHeader'))
  ])

  const charge = c.log(c.merge([
    p.take('type'),
    c.maybe(p.take('bond')),
    p.take('code'),
    c.maybe(p.take('dispo')),
    c.map(
      c.many1('lines', p.take('charge')),
      // Unwrap charge lines
      ({ lines }) => ({ charge: lines.map(({ charge }) => charge).join(' ') })
    ),
    c.maybe(p.take('warrantNumber')),
    c.maybe(p.take('citationNumber')),
    c.maybe(chargeTableHeaders) // page wrap
  ]), log, 'charge row')

  const endOfDocument = c.merge([
    c.ignore(p.take('totalInmatesLabel')),
    c.map(p.take('totalInmates'), ({ totalInmates }) => ({ totalInmates: ~~totalInmates }))
  ])

  const grammar = c.merge([
    c.many1('rows',
      c.merge([
        fixedFields,
        chargeTableHeaders,
        c.many1('charges', charge)
      ])
    ),
    endOfDocument
  ])

  const parsed = parse(grammar, tokens)
  const { rows, totalInmates } = parsed
  if (rows.length === totalInmates) {
    console.log(`Successfully parsed ${rows.length} entries in ${Date.now() - t0}ms`)
  } else {
    throw new Error(`PDF reported ${totalInmates} inmates, but ${rows.length} were parsed`)
  }

  await promisify(fs.writeFile)('./parsed.json', JSON.stringify(parsed, null, 2))
}

main().catch(e => {
  log.slice(-30).forEach((x) => console.log(x))
  console.error('Abort.', e)
  process.exit(1)
})
