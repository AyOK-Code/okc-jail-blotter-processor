const Sequelize = require('sequelize')
const { Person, Pdf, Booking, Offense } = require('./models')
const env = process.env.NODE_ENV || 'development'
const config = require('./config/config')[env]

exports.filterLinks = async function (links) {
  const sequelize = new Sequelize(config)
  const result = await sequelize.transaction(async (transaction) => {
    const pdfs = await Pdf.findAll({
      where: {
        postedOn: links.map(({ postedOn }) => postedOn)
      }
    })
    const existing = new Set(pdfs.map((x) => x.postedOn))
    return links.filter(({ postedOn }) => !existing.has(postedOn))
  })
  await sequelize.close()
  return result
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
