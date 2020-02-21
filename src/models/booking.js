module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    pdfId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      field: 'pdf_id'
    },
    personId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      field: 'person_id'
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
      type: DataTypes.TEXT,
      field: 'inmate_number'
    },
    bookingNumber: {
      allowNull: false,
      type: DataTypes.TEXT,
      field: 'booking_number'
    },
    bookingType: {
      allowNull: true,
      type: DataTypes.TEXT,
      field: 'booking_type'
    },
    bookingDate: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'booking_date'
    },
    releaseDate: {
      allowNull: true,
      type: DataTypes.DATE,
      field: 'release_date'
    }
  }, {
    timestamps: true,
    underscored: true,
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
