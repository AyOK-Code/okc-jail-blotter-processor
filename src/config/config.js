module.exports = {
  // development: {
  //   username: 'postgres',
  //   password: 'Password123',
  //   database: 'postgres',
  //   host: '127.0.0.1',
  //   dialect: 'postgres'
  // },
  development: {
    username: 'sa',
    password: 'Password@123',
    database: 'temp',
    host: '0.0.0.0',
    dialect: 'mssql',
    dialectOptions: {
      dateFirst: 1,
      useUTC: false
    }
  },
  localprod: {
    username: 'prod',
    password: process.env.PROD_DB_PASSWORD,
    database: 'prod',
    host: process.env.PROD_DB_HOSTNAME,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        key: process.env.PROD_DB_CLIENT_KEY,
        cert: process.env.PROD_DB_CLIENT_CERT,
        ca: process.env.PROD_DB_SERVER_CA
      }
    }
  },
  production: {
    username: 'prod',
    password: process.env.PROD_DB_PASSWORD,
    database: 'prod',
    host: process.env.PROD_DB_SOCKET,
    dialect: 'postgres'
  }
}
