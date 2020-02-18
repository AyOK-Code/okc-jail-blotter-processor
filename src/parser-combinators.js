class ParsingError extends Error {}

function debug (tokens, pos) {
  return `The unexpected data begins at: ${JSON.stringify(tokens.slice(pos, pos + 10))}`
}

/**************
*** PARSERS ***
**************/
const p = {}
p.satisfy = (fn) => (tokens, init) => {
  if (init >= tokens.length) {
    throw new ParsingError(`Read past eof: ${init}/${tokens.length}`)
  }
  const capture = fn(tokens[init])
  return { pos: init + 1, capture }
}

p.accept = (tokens, init) => p.satisfy(x => x)(tokens, init)

p.eof = (tokens, init) => {
  if (init < tokens.length) {
    throw new ParsingError(`Not at eof: ${init}/${tokens.length}`)
  }
  return { pos: init, capture: {} }
}

/******************
*** COMBINATORS ***
******************/
const c = {}
c.log = (parser, log, name) => (tokens, init) => {
  const parsed = parser(tokens, init)
  const { pos, capture } = parsed
  log.push(`Moving to ${pos} after parsing '${name}':`)
  log.push(capture)
  return parsed
}
c.map = (parser, fn) => (tokens, init) => {
  const { pos, capture } = parser(tokens, init)
  return { pos, capture: fn(capture) }
}
c.ignore = (parser) => (tokens, init) => {
  const { pos } = parser(tokens, init)
  return { pos, capture: {} }
}
c.maybe = (parser) => (tokens, init) => {
  try {
    return parser(tokens, init)
  } catch (err) {
    if (!(err instanceof ParsingError)) {
      throw err
    }
    return { pos: init, capture: {} }
  }
}
c.first = (parsers) => (tokens, init) => {
  for (var parser of parsers) {
    try {
      return parser(tokens, init)
    } catch (err) {
      if (!(err instanceof ParsingError)) {
        throw err
      }
    }
  }
  throw new ParsingError(`No valid option. ${debug(tokens, init)}`)
}
c.merge = (parsers) => (tokens, init) => {
  if (parsers.length > tokens.length - init) {
    throw new ParsingError(`Not enough data to merge. ${debug(tokens, init)}`)
  }
  const merged = {}
  const pos = parsers.reduce((acc, parser) => {
    const { pos, capture } = parser(tokens, acc)
    Object.assign(merged, capture)
    return pos
  }, init)
  return { pos, capture: merged }
}
c.many = (key, parser) => (tokens, init) => {
  const elements = []
  let pos = init
  do {
    try {
      const parsed = parser(tokens, pos)
      if (!(Object.keys(parsed.capture).length === 0 && parsed.capture.constructor === Object)) {
        elements.push(parsed.capture)
      }
      pos = parsed.pos
    } catch (err) {
      if (!(err instanceof ParsingError)) {
        throw err
      }
      return { pos, capture: { [key]: elements } }
    }
  } while (pos < tokens.length)
  return { pos, capture: { [key]: elements } }
}
c.many1 = (key, parser) => (tokens, init) => {
  const parsed = c.many(key, parser)(tokens, init)
  if (parsed.capture[key].length === 0) {
    throw new Error(`Sequence '${key}' must contain least 1 element. ${debug(tokens, init)}`)
  }
  return parsed
}
c.skipUntil = (parser) => (tokens, init) => {
  let pos = init
  do {
    try {
      parser(tokens, pos)
      return { pos, capture: {} }
    } catch (err) {
      if (!(err instanceof ParsingError)) {
        throw err
      }
    }
    pos++
  } while (pos < tokens.length)
  return { pos, capture: {} }
}

const parse = (parser, tokens) => {
  try {
    const { pos, capture } = parser(tokens, 0)
    if (pos !== tokens.length) {
      throw new Error(`Data present after end of grammar. ${debug(tokens, pos)}`)
    }
    return capture
  } catch (err) {
    err.message = `A syntax error occured: ${err.message}.`
    throw err
  }
}

module.exports = {
  ParsingError,
  p,
  c,
  parse
}
