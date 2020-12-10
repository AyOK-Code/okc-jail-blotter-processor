module.exports = (sequelize, DataTypes) => {
  const Offense = sequelize.define('Offense', {
    bookingId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      field: 'booking_id'
    },
    type: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    bond: {
      allowNull: true,
      type: DataTypes.DECIMAL(9, 2)
    },
    code: {
      allowNull: true,
      type: DataTypes.TEXT
    },
    dispo: {
      allowNull: true,
      type: DataTypes.TEXT
    },
    charge: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    warrantNumber: {
      allowNull: true,
      type: DataTypes.TEXT,
      field: 'warrant_number'
    },
    citationNumber: {
      allowNull: true,
      type: DataTypes.TEXT,
      field: 'citation_number'
    }
  }, {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    tableName: 'offenses'
  })
  Offense.associate = function (models) {
    Offense.belongsTo(models.Booking)
  }
  return Offense
}
