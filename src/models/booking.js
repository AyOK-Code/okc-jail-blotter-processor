module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    pdfId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
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
    Booking.belongsTo(models.Pdf)
    Booking.belongsTo(models.Person)
    Booking.hasMany(models.Offense)
  }
  return Booking
}
