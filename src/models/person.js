module.exports = (sequelize, DataTypes) => {
  const Person = sequelize.define('Person', {
    firstName: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    lastName: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    dob: {
      allowNull: true,
      type: DataTypes.DATEONLY
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
    }
  }, {
    timestamps: true,
    freezeTableName: true,
    tableName: 'people',
    indexes: [{
      name: 'idx_identity',
      unique: true,
      using: 'BTREE',
      fields: ['firstName', 'lastName', 'dob']
    }]
  })
  Person.associate = function (models) {
    Person.hasMany(models.Booking)
  }
  return Person
}
