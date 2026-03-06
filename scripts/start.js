const { execSync } = require("child_process");

execSync("npx prisma migrate deploy", { stdio: "inherit" });
execSync("npm start", { stdio: "inherit" });
