module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    personId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    sex: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    race: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    zip: {
      allowNull: true,
      type: DataTypes.TEXT
    },
    inmateNumber: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    bookingNumber: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    bookingType: {
      allowNull: true,
      type: DataTypes.TEXT
    },
    bookingDate: {
      allowNull: false,
      type: DataTypes.DATE
    },
    releaseDate: {
      allowNull: true,
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    freezeTableName: true,
    tableName: 'bookings'
  })
  Booking.associate = function (models) {
    Booking.belongsTo(models.Person)
    Booking.hasMany(models.Offense)
  }
  return Booking
}
