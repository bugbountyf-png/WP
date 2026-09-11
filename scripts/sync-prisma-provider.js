const fs = require("fs");
const path = require("path");

function databaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_PUBLIC_URL ||
    process.env.DATABASE_PRIVATE_URL ||
    ""
  );
}

function isPostgres(url) {
  return /postgres/i.test(url);
}

function onRailway() {
  return Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);
}

const url = databaseUrl();
if (!process.env.DATABASE_URL && url) {
  process.env.DATABASE_URL = url;
}

const provider = isPostgres(url) || onRailway() ? "postgresql" : "sqlite";
const file = path.join(__dirname, "..", "prisma", "schema.prisma");
const schema = fs.readFileSync(file, "utf8").replace(/provider = "(sqlite|postgresql)"/, `provider = "${provider}"`);
fs.writeFileSync(file, schema);
console.log(`Prisma provider: ${provider}`);

module.exports = { provider, databaseUrl, onRailway };
