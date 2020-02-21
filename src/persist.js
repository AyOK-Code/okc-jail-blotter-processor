const Sequelize = require('sequelize')
const { Person, Pdf, Booking, Offense } = require('./models')

exports.save = async function (config, parsed, postedOn) {
  const sequelize = new Sequelize(config)
  await sequelize.authenticate()
  console.log('Authenticated!')

  await sequelize.transaction(async (transaction) => {
    const pdf = await Pdf.create(
      { postedOn: postedOn.format('YYYY-MM-DD') },
      { transaction }
    )

    await Promise.all(parsed.rows.map(async (row) => {
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
  })

  await sequelize.close()
}
