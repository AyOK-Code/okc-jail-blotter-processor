module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all([
        queryInterface.createTable('people', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          firstName: {
            allowNull: false,
            type: Sequelize.TEXT
          },
          lastName: {
            allowNull: false,
            type: Sequelize.TEXT
          },
          dob: {
            allowNull: true,
            type: Sequelize.DATEONLY
          },
          sex: {
            allowNull: false,
            type: Sequelize.TEXT
          },
          race: {
            allowNull: false,
            type: Sequelize.TEXT
          },
          zip: {
            allowNull: true,
            type: Sequelize.TEXT
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
          }
        }),
        queryInterface.createTable('pdfs', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          postedOn: {
            allowNull: false,
            type: Sequelize.DATEONLY
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
          }
        }),
        queryInterface.createTable('bookings', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          pdfId: {
            allowNull: false,
            type: Sequelize.INTEGER
          },
          personId: {
            allowNull: false,
            type: Sequelize.INTEGER
          },
          sex: {
            allowNull: false,
            type: Sequelize.TEXT
          },
          race: {
            allowNull: false,
            type: Sequelize.TEXT
          },
          zip: {
            allowNull: true,
            type: Sequelize.TEXT
          },
          inmateNumber: {
            allowNull: false,
            type: Sequelize.TEXT
          },
          bookingNumber: {
            allowNull: false,
            type: Sequelize.TEXT
          },
          bookingType: {
            allowNull: true,
            type: Sequelize.TEXT
          },
          bookingDate: {
            allowNull: false,
            type: Sequelize.DATE
          },
          releaseDate: {
            allowNull: true,
            type: Sequelize.DATE
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
          }
        }),
        queryInterface.createTable('offenses', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          bookingId: {
            allowNull: false,
            type: Sequelize.INTEGER
          },
          type: {
            allowNull: false,
            type: Sequelize.TEXT
          },
          bond: {
            allowNull: true,
            type: Sequelize.DECIMAL(9, 2)
          },
          code: {
            allowNull: false,
            type: Sequelize.TEXT
          },
          dispo: {
            allowNull: true,
            type: Sequelize.TEXT
          },
          charge: {
            allowNull: false,
            type: Sequelize.TEXT
          },
          warrantNumber: {
            allowNull: true,
            type: Sequelize.TEXT
          },
          citationNumber: {
            allowNull: true,
            type: Sequelize.TEXT
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
          }
        })
      ])
      return Promise.all([
        queryInterface.addIndex(
          'people',
          {
            name: 'idx_identity',
            unique: true,
            using: 'BTREE',
            fields: ['firstName', 'lastName', 'dob']
          },
          { transaction }
        ),
        queryInterface.addIndex(
          'pdfs',
          {
            name: 'idx_postedOn',
            unique: true,
            using: 'BTREE',
            fields: ['postedOn']
          },
          { transaction }
        )
      ])
    })
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.dropTable('offenses'),
      queryInterface.dropTable('bookings'),
      queryInterface.dropTable('pdfs'),
      queryInterface.dropTable('people')
    ])
  }
}
