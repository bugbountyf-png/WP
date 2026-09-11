const fs = require("fs");
const path = require("path");

const url = process.env.DATABASE_URL || "";
const provider = url.startsWith("postgres") ? "postgresql" : "sqlite";
const file = path.join(__dirname, "..", "prisma", "schema.prisma");
const schema = fs.readFileSync(file, "utf8").replace(/provider = "(sqlite|postgresql)"/, `provider = "${provider}"`);
fs.writeFileSync(file, schema);
console.log(`Prisma provider: ${provider}`);
