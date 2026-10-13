require("dotenv").config();
const { Pool } = require("pg");

const connectionString = process.env.NETLIFY_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Set NETLIFY_DB_URL or DATABASE_URL before starting the API");
}

const pool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX || 2),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

module.exports = pool;
