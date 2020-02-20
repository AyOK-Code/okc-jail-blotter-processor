module.exports = {
  development: {
    username: 'postgres',
    password: 'Password123',
    database: 'postgres',
    host: '127.0.0.1',
    dialect: 'postgres'
  },
  production: {
    username: process.env.PROD_DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOSTNAME,
    dialect: 'postgres'
  }
}
