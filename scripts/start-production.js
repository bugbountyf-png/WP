const { spawnSync } = require("child_process");
const { provider, databaseUrl } = require("./sync-prisma-provider");

function run(args) {
  const result = spawnSync("npx", args, { stdio: "inherit", env: process.env, shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const url = databaseUrl() || process.env.DATABASE_URL || "";

if (provider === "postgresql") {
  if (!url) {
    console.error("DATABASE_URL belum ada. Di Railway: New → Database → PostgreSQL, lalu connect ke service web ini.");
    process.exit(1);
  }
  console.log("Generating Prisma client (postgresql)…");
  run(["prisma", "generate"]);
  console.log("Applying migrations…");
  run(["prisma", "migrate", "deploy"]);
} else {
  run(["prisma", "generate"]);
}

if (process.env.NODE_ENV === "production" && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)) {
  console.warn("AUTH_SECRET belum aman (kosong atau < 32 karakter). Login tidak akan jalan sampai variabel ini diisi.");
}

const port = process.env.PORT || "3000";
console.log(`Starting Next.js on 0.0.0.0:${port}`);
run(["next", "start", "-H", "0.0.0.0", "-p", port]);
