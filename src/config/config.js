module.exports = {
  development: {
    username: 'postgres',
    password: 'Password123',
    database: 'postgres',
    host: '127.0.0.1',
    dialect: 'postgres'
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres'
  }
}
