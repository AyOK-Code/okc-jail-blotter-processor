class ParsingError extends Error {}

const debug = (init, { tokens }) =>
  `The unexpected data begins at: ${JSON.stringify(tokens.slice(init, init + 15))}`

const checkError = (err) => {
  if (!(err instanceof ParsingError)) {
    throw err
  }
}

const isEmpty = (obj) => Object.keys(obj).length === 0 && obj.constructor === Object

/**************
*** PARSERS ***
**************/
const parsers = {}
parsers.satisfy = (fn) => (init, { tokens }) => {
  if (init >= tokens.length) {
    throw new ParsingError(`Read past eof: ${init}/${tokens.length}`)
  }
  const capture = fn(tokens[init])
  return { pos: init + 1, capture }
}
parsers.accept = (init, state) => parsers.satisfy((x) => x)(init, state)
parsers.eof = (init, { tokens }) => {
  if (init < tokens.length) {
    throw new ParsingError(`Not at eof: ${init}/${tokens.length}`)
  }
  return { pos: init, capture: {} }
}

/******************
*** COMBINATORS ***
******************/
const combinators = {}
combinators.log = (p, name) => (init, state) => {
  state.log.push(`Trying '${name}'`)
  const parsed = p(init, state)
  const { pos, capture } = parsed
  state.log.push(`CAPTURED '${name}'. Now at ${pos}.`)
  state.log.push(capture)
  return parsed
}
combinators.map = (p, fn) => (init, state) => {
  const { pos, capture } = p(init, state)
  return { pos, capture: fn(capture) }
}
combinators.maybe = (p) => (init, state) => {
  try {
    return p(init, state)
  } catch (err) {
    checkError(err)
    return { pos: init, capture: {} }
  }
}
combinators.first = (ps) => (init, state) => {
  for (const p of ps) {
    try {
      return p(init, state)
    } catch (err) {
      checkError(err)
    }
  }
  throw new ParsingError(`No valid option. ${debug(init, state)}`)
}
combinators.merge = (ps) => (init, state) => {
  return ps.reduce(({ pos, capture }, p) => {
    const parsed = p(pos, state)
    Object.assign(capture, parsed.capture)
    return { pos: parsed.pos, capture }
  }, { pos: init, capture: {} })
}
combinators.many = (key, p) => (init, state) => {
  const elements = []
  let i = init
  do {
    try {
      const { pos, capture } = p(i, state)
      if (!isEmpty(capture)) {
        elements.push(capture)
      }
      i = pos
    } catch (err) {
      checkError(err)
      return { pos: i, capture: { [key]: elements } }
    }
  } while (i < state.tokens.length)
  return { pos: i, capture: { [key]: elements } }
}
combinators.many1 = (key, p) => (init, state) => {
  const parsed = combinators.many(key, p)(init, state)
  if (parsed.capture[key].length === 0) {
    throw new ParsingError(`Sequence '${key}' must contain least 1 element. ${debug(init, state)}`)
  }
  return parsed
}
combinators.skipUntil = (p) => (init, state) => {
  let pos = init
  do {
    try {
      p(pos, state)
      return { pos, capture: {} }
    } catch (err) {
      checkError(err)
    }
    pos++
  } while (pos < state.tokens.length)
  return { pos, capture: {} }
}

/**************
*** MAPPERS ***
**************/
const mappers = {}
mappers.ignore = (p) => combinators.map(p, () => ({}))
const stringJoiner = (c) => (key, p) => combinators.map(
  c('lines', p),
  ({ lines }) => ({ [key]: lines.map((x) => x[key]).join(' ') })
)
mappers.join = stringJoiner(combinators.many)
mappers.join1 = stringJoiner(combinators.many1)

/**********
*** RUN ***
**********/
function parse (parser, tokens, log = []) {
  try {
    const state = { tokens, log }
    const { pos, capture } = parser(0, state)
    if (pos !== tokens.length) {
      throw new Error(`Some data could not be parsed. ${debug(pos, state)}`)
    }
    return { data: capture, log }
  } catch (err) {
    err.message = `Syntax error during parsing: ${err.message}`
    throw err
  }
}

module.exports = {
  ParsingError,
  parsers,
  combinators,
  mappers,
  parse
}
