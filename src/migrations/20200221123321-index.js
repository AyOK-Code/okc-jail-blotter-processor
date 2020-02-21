module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      return Promise.all([
        queryInterface.addIndex(
          'people',
          {
            name: 'idx_identity',
            unique: true,
            using: 'BTREE',
            fields: ['first_name', 'last_name', 'dob']
          },
          { transaction }
        ),
        queryInterface.addIndex(
          'pdfs',
          {
            name: 'idx_posted_on',
            unique: true,
            using: 'BTREE',
            fields: ['posted_on']
          },
          { transaction }
        )
      ])
    })
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.dropIndex('idx_identity'),
      queryInterface.dropIndex('idx_posted_on')
    ])
  }
}
