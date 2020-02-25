module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('people', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        first_name: {
          allowNull: false,
          type: Sequelize.TEXT
        },
        last_name: {
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
        transient: {
          allowNull: false,
          type: Sequelize.BOOLEAN
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }, { transaction })
      await queryInterface.createTable('pdfs', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        posted_on: {
          allowNull: false,
          type: Sequelize.DATEONLY
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }, { transaction })
      await queryInterface.createTable('bookings', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        pdf_id: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: 'pdfs',
            key: 'id'
          }
        },
        person_id: {
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
        transient: {
          allowNull: false,
          type: Sequelize.BOOLEAN
        },
        inmate_number: {
          allowNull: false,
          type: Sequelize.TEXT
        },
        booking_number: {
          allowNull: false,
          type: Sequelize.TEXT
        },
        booking_type: {
          allowNull: true,
          type: Sequelize.TEXT
        },
        booking_date: {
          allowNull: false,
          type: Sequelize.DATE
        },
        release_date: {
          allowNull: true,
          type: Sequelize.DATE
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }, { transaction })
      await queryInterface.createTable('offenses', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        booking_id: {
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
        warrant_number: {
          allowNull: true,
          type: Sequelize.TEXT
        },
        citation_number: {
          allowNull: true,
          type: Sequelize.TEXT
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }, { transaction })
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
