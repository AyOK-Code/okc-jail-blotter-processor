module.exports = (sequelize, DataTypes) => {
  const Pdf = sequelize.define('Pdf', {
    postedOn: {
      allowNull: false,
      type: DataTypes.DATEONLY
    }
  }, {
    timestamps: true,
    freezeTableName: true,
    tableName: 'pdfs',
    indexes: [{
      name: 'idx_postedOn',
      unique: true,
      using: 'BTREE',
      fields: ['postedOn']
    }]
  })
  Pdf.associate = function (models) {
    Pdf.hasMany(models.Booking)
  }
  return Pdf
}
