import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env.local",
  );
}

const outputDir = path.resolve(process.cwd(), "src/lib");
const outputFile = path.join(outputDir, "env.generated.ts");

fs.mkdirSync(outputDir, { recursive: true });

const content = `// AUTO-GENERATED FILE. DO NOT EDIT.
export const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};
export const SUPABASE_PUBLISHABLE_KEY = ${JSON.stringify(supabasePublishableKey)};
`;

fs.writeFileSync(outputFile, content, "utf8");

console.log("Supabase environment generated.");
