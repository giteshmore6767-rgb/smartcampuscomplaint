
require("dotenv").config();
const usePostgres = Boolean(process.env.NETLIFY_DB_URL || process.env.DATABASE_URL);
const pool = usePostgres
  ? new (require("pg").Pool)({
      connectionString: process.env.NETLIFY_DB_URL || process.env.DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX || 2),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    })
  : require("mysql2/promise").createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "smart_campus",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

async function queryWith(connection, sql, values = []) {
  if (usePostgres) return connection.query(sql, values);

  const returnsId = /\s+RETURNING\s+id\s*;?\s*$/i.test(sql);
  const mysqlSql = sql
    .replace(/::int\b/gi, "")
    .replace(/\$\d+/g, "?")
    .replace(/\s+RETURNING\s+id\s*;?\s*$/i, "");
  const [result] = await connection.query(mysqlSql, values);

  if (Array.isArray(result)) return { rows: result, rowCount: result.length };
  return {
    rows: returnsId && result.insertId ? [{ id: result.insertId }] : [],
    rowCount: result.affectedRows,
    insertId: result.insertId
  };
}

module.exports = {
  isPostgres: usePostgres,
  query: (sql, values) => queryWith(pool, sql, values),
  async connect() {
    if (usePostgres) return pool.connect();
    const connection = await pool.getConnection();
    return {
      query: (sql, values) => queryWith(connection, sql, values),
      release: () => connection.release()
    };
  }
};
