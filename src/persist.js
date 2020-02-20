const Sequelize = require('sequelize')
const { Person, Booking, Offense } = require('./models')

exports.save = async function (config, parsed) {
  const sequelize = new Sequelize(config)
  await sequelize.authenticate()
  console.log('Authenticated!')

  await sequelize.transaction(async (transaction) => {
    await Promise.all(parsed.rows.map(async (row) => {
      const [person] = await Person.upsert(
        row,
        { transaction, returning: true }
      )

      const booking = await Booking.create(
        { ...row, personId: person.id },
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
