module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      return Promise.all([
        queryInterface.changeColumn('people', 'race', {
          allowNull: true,
          type: Sequelize.TEXT
        },
        { transaction }),
        queryInterface.changeColumn('bookings', 'race', {
          allowNull: true,
          type: Sequelize.TEXT
        },
        { transaction })
      ])
    })
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('people', 'race', {
        allowNull: false,
        type: Sequelize.TEXT
      }),
      queryInterface.changeColumn('bookings', 'race', {
        allowNull: false,
        type: Sequelize.TEXT
      })
    ])
  }
}
