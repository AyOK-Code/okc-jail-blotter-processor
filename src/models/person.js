module.exports = (sequelize, DataTypes) => {
  const Person = sequelize.define('Person', {
    firstName: {
      allowNull: false,
      type: DataTypes.TEXT,
      field: 'first_name'
    },
    lastName: {
      allowNull: false,
      type: DataTypes.TEXT,
      field: 'last_name'
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
    underscored: true,
    freezeTableName: true,
    tableName: 'people',
    indexes: [{
      name: 'idx_identity',
      unique: true,
      using: 'BTREE',
      fields: ['first_name', 'last_name', 'dob']
    }]
  })
  Person.associate = function (models) {
    Person.hasMany(models.Booking)
  }
  return Person
}
