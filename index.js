import "dotenv/config";

import { runApp } from "./run.js";

void runApp();

process.on('SIGINT', () => {
    process.exit(0);
});