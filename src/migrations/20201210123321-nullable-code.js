module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      return Promise.all([
        queryInterface.changeColumn('offenses', 'code', {
          allowNull: true,
          type: Sequelize.TEXT
        },
        { transaction })
      ])
    })
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('offenses', 'code', {
        allowNull: false,
        type: Sequelize.TEXT
      })
    ])
  }
}
