const { Op, Sequelize } = require('sequelize')
const crypto = require('crypto')
const { Person, Pdf, Booking, Offense, sequelize } = require('./models')
const env = process.env.NODE_ENV || 'development'
const config = require('./config/config')[env]
const moment = require('moment')

const hashPerson = function (propArr) {
  const hash = crypto.createHash('sha256')
  hash.update(JSON.stringify(propArr))
  return hash.digest('base64')
}

/* Sequelize erroneously adds timezone to DATEONLY on retrieval from MSSQL
  so we need to add a day to make it right. We can't future-proof this,
  as the date is already wrong and converted to a string when we get it */
const fixDateOnly = function (d) {
  const m = moment.utc(d)
    m.add(1, 'd')
    return m.format('YYYY-MM-DD')
}

exports.filterLinks = async function (links) {
  const sequelize = new Sequelize(config)
  const result = await sequelize.transaction(async (transaction) => {
    const pdfs = await Pdf.findAll({
      where: {
        postedOn: links.map(({ postedOn }) => postedOn)
      }
    })
    const existing = new Set(pdfs.map((x) => { return fixDateOnly(x.postedOn) }))
    return links.filter(({ postedOn }) => !existing.has(postedOn))
  })
  await sequelize.close()
  return result
}

exports.rekey = async function () {
  await sequelize.transaction(async (transaction) => {
    const people = await Person.findAll({
      attributes: ['id', 'hash', 'first_name', 'last_name', 'dob']
    })
    await Promise.all(people.map(async (row) => {
      if (row.dob == null) {
        row.dob = null
      } else {
        row.dob = fixDateOnly(row.dob)
      }
      row.hash = hashPerson([row.getDataValue('first_name'), row.getDataValue('last_name'), row.dob])

      await Person.update({ hash: row.hash },
        {
          where: {
            id: row.getDataValue('id')
          },
          transaction
        })
    }))
  })
}

exports.save = async function (processed) {
  if (processed.length === 0) {
    return
  }
  const sequelize = new Sequelize(config)

  await sequelize.transaction(async (transaction) => {
    await Promise.all(processed.map(async ({ rows, postedOn }) => {
      const pdf = await Pdf.create(
        { postedOn },
        { transaction }
      )
      await Promise.all(rows.map(async (row) => {
        if (row.dob == null) {
          row.dob = null
        }
        row.hash = hashPerson([row.firstName, row.lastName, row.dob])

        const [person] = await Person.upsert(
          row,
          { transaction, returning: true }
        )

        const booking = await Booking.create(
          { ...row, personId: person.id, pdfId: pdf.id },
          { transaction }
        )

        await Offense.bulkCreate(
          row.offenses.map((offense) => ({ ...offense, bookingId: booking.id })),
          { transaction }
        )
      }))
    }))
  })

  await sequelize.close()
}
