class ParsingError extends Error {}

function debug (init, { tokens }) {
  return `The unexpected data begins at: ${JSON.stringify(tokens.slice(init, init + 10))}`
}

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
parsers.accept = (init, state) => parsers.satisfy(x => x)(init, state)
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
    if (!(err instanceof ParsingError)) {
      throw err
    }
    return { pos: init, capture: {} }
  }
}
combinators.first = (ps) => (init, state) => {
  for (const p of ps) {
    try {
      return p(init, state)
    } catch (err) {
      if (!(err instanceof ParsingError)) {
        throw err
      }
    }
  }
  throw new ParsingError(`No valid option. ${debug(init, state)}`)
}
combinators.merge = (ps) => (init, state) => {
  const merged = {}
  const pos = ps.reduce((acc, p) => {
    const { pos, capture } = p(acc, state)
    Object.assign(merged, capture)
    return pos
  }, init)
  return { pos, capture: merged }
}
combinators.many = (key, p) => (init, state) => {
  const elements = []
  let pos = init
  do {
    try {
      const parsed = p(pos, state)
      if (!(Object.keys(parsed.capture).length === 0 && parsed.capture.constructor === Object)) {
        elements.push(parsed.capture)
      }
      // elements.push(parsed.capture)
      pos = parsed.pos
    } catch (err) {
      if (!(err instanceof ParsingError)) {
        throw err
      }
      return { pos, capture: { [key]: elements } }
    }
  } while (pos < state.tokens.length)
  return { pos, capture: { [key]: elements } }
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
      if (!(err instanceof ParsingError)) {
        throw err
      }
    }
    pos++
  } while (pos < state.tokens.length)
  return { pos, capture: {} }
}

/**************
*** MAPPERS ***
**************/
const mappers = {}
mappers.ignore = (p) => (init, state) => {
  const { pos } = p(init, state)
  return { pos, capture: {} }
}
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
