import { Dialect, Sequelize } from 'sequelize';

if (!process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_DIALECT) {
    throw new Error('DB_USERNAME, DB_PASSWORD, DB_NAME, DB_DIALECT, and DB_HOST must be defined');
}

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT as Dialect,
});