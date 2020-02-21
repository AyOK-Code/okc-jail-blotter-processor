module.exports = (sequelize, DataTypes) => {
  const Pdf = sequelize.define('Pdf', {
    postedOn: {
      allowNull: false,
      type: DataTypes.DATEONLY,
      field: 'posted_on'
    }
  }, {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    tableName: 'pdfs',
    indexes: [{
      name: 'idx_posted_on',
      unique: true,
      using: 'BTREE',
      fields: ['posted_on']
    }]
  })
  Pdf.associate = function (models) {
    Pdf.hasMany(models.Booking)
  }
  return Pdf
}
