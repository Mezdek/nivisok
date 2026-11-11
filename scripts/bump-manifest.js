import { readFileSync, writeFileSync } from "fs";

const version = process.env.npm_package_version;
if (!version) throw new Error("No version argument provided");

const manifest = JSON.parse(readFileSync("public/manifest.json", "utf8"));
manifest.version = version;
writeFileSync("public/manifest.json", JSON.stringify(manifest, null, 2));
console.log(`manifest.json bumped to ${version}`);
