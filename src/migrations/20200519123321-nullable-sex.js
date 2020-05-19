module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      return Promise.all([
        queryInterface.changeColumn('people', 'sex', {
          allowNull: true,
          type: Sequelize.TEXT
        },
        { transaction }),
        queryInterface.changeColumn('bookings', 'sex', {
          allowNull: true,
          type: Sequelize.TEXT
        },
        { transaction })
      ])
    })
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('people', 'sex', {
        allowNull: false,
        type: Sequelize.TEXT
      }),
      queryInterface.changeColumn('bookings', 'sex', {
        allowNull: false,
        type: Sequelize.TEXT
      })
    ])
  }
}
