// Generated from packages/evals/cases. Reference diagnoses are hand-written answers for each case, not live model output.
window.CASES = [
 {
  "id": "missing-env-var",
  "title": "Missing env var",
  "tag": "config",
  "blurb": "Code reads a renamed variable that was never set in production.",
  "commit": "abc1234",
  "lastGood": "9f8e7d6",
  "env": [
   {
    "name": "DATABASE_URL",
    "change": "removed"
   }
  ],
  "logs": "Cloning github.com/acme/shop (Branch: main, Commit: abc1234)\nRunning \"npm run build\"\n> shop@1.0.0 build\n> next build\nCreating an optimized production build ...\nCompiled successfully\nCollecting page data ...\nError: DATABASE_URL is not defined\n    at getDb (/vercel/path0/src/lib/db.ts:6:11)\n    at /vercel/path0/src/app/products/page.tsx:4:18\nError: Failed to collect page data for /products\nBuild error occurred\nError: Command \"npm run build\" exited with 1",
  "diff": "diff --git a/src/lib/db.ts b/src/lib/db.ts\nindex 1a2b3c4..5d6e7f8 100644\n--- a/src/lib/db.ts\n+++ b/src/lib/db.ts\n@@ -1,6 +1,9 @@\n import { Pool } from \"pg\";\n-const url = process.env.DB_URL;\n+const url = process.env.DATABASE_URL;\n+if (!url) throw new Error(\"DATABASE_URL is not defined\");\n export function getDb() {\n   return new Pool({ connectionString: url });\n }\ndiff --git a/README.md b/README.md\nindex 111..222 100644\n--- a/README.md\n+++ b/README.md\n@@ -1 +1,2 @@\n # shop\n+Typo fix.",
  "diagnosis": {
   "cause": "Commit abc1234 renamed the variable read in src/lib/db.ts from DB_URL to DATABASE_URL, but DATABASE_URL is not set in the Vercel project, so the build fails while collecting page data.",
   "fix": "Add DATABASE_URL to the project's environment variables (copy the value of DB_URL), then redeploy.",
   "confidence": "high",
   "evidence": [
    {
     "type": "log",
     "quote": "Error: DATABASE_URL is not defined"
    },
    {
     "type": "diff",
     "quote": "+const url = process.env.DATABASE_URL;"
    },
    {
     "type": "env",
     "quote": "DATABASE_URL removed"
    }
   ]
  },
  "fake": {
   "type": "log",
   "quote": "Error: connection to database timed out after 30s"
  }
 },
 {
  "id": "type-error",
  "title": "Type error",
  "tag": "code",
  "blurb": "A function signature changed; one caller was left behind.",
  "commit": "a1b2c3d",
  "lastGood": "0lda1b2",
  "env": [],
  "logs": "Running \"npm run build\"\n> next build\nFailed to compile.\n\n./src/app/cart/page.tsx:14:31\nType error: Argument of type 'number' is not assignable to parameter of type '{ id: number; qty: number; }'.\n  12 | export default function Cart() {\n  13 |   const items = useCart();\n> 14 |   const total = calcTotal(items, 0.2);\n     |                               ^\nError: Command \"npm run build\" exited with 1",
  "diff": "diff --git a/src/lib/price.ts b/src/lib/price.ts\n--- a/src/lib/price.ts\n+++ b/src/lib/price.ts\n@@ -1,4 +1,4 @@\n-export function calcTotal(items: Item[], taxRate: number) {\n+export function calcTotal(items: Item[], opts: { id: number; qty: number }) {\n   return items.reduce((s, i) => s + i.price * i.qty, 0);\n }\ndiff --git a/public/logo.svg b/public/logo.svg\n--- a/public/logo.svg\n+++ b/public/logo.svg\n@@ -1 +1 @@\n-<svg width=\"10\"/>\n+<svg width=\"12\"/>",
  "diagnosis": {
   "cause": "calcTotal in src/lib/price.ts now takes an options object instead of a tax rate, but src/app/cart/page.tsx still calls it with the number 0.2.",
   "fix": "Update the call in cart/page.tsx to pass { id, qty } as the new signature requires, or restore the old parameter.",
   "confidence": "high",
   "evidence": [
    {
     "type": "log",
     "quote": "Type error: Argument of type 'number' is not assignable to parameter of type '{ id: number; qty: number; }'."
    },
    {
     "type": "diff",
     "quote": "+export function calcTotal(items: Item[], opts: { id: number; qty: number }) {"
    }
   ]
  },
  "fake": {
   "type": "log",
   "quote": "Type error: Property 'taxRate' does not exist on type 'Item'."
  }
 },
 {
  "id": "missing-dependency",
  "title": "Missing dependency",
  "tag": "deps",
  "blurb": "An import was added; the package was never installed.",
  "commit": "b2c3d4e",
  "lastGood": "0ldb2c3",
  "env": [],
  "logs": "Running \"npm run build\"\n> vite build\nvite v5.2.0 building for production...\ntransforming...\nx Build failed in 1.2s\nerror during build:\nError: [vite]: Rollup failed to resolve import \"zod\" from \"/vercel/path0/src/forms/signup.ts\".\nThis is most likely unintended because it can break your application at runtime.\nError: Command \"npm run build\" exited with 1",
  "diff": "diff --git a/src/forms/signup.ts b/src/forms/signup.ts\n--- a/src/forms/signup.ts\n+++ b/src/forms/signup.ts\n@@ -1,3 +1,7 @@\n+import { z } from \"zod\";\n+export const SignupSchema = z.object({ email: z.string().email() });\n export function validateSignup(v: unknown) {\n   return true;\n }\ndiff --git a/package.json b/package.json\n--- a/package.json\n+++ b/package.json\n@@ -3,3 +3,3 @@\n-  \"version\": \"1.4.0\",\n+  \"version\": \"1.4.1\",",
  "diagnosis": {
   "cause": "src/forms/signup.ts now imports zod, but zod is not listed in package.json, so the bundler cannot resolve it.",
   "fix": "Run npm install zod, commit the updated package.json and lockfile, and redeploy.",
   "confidence": "high",
   "evidence": [
    {
     "type": "log",
     "quote": "Error: [vite]: Rollup failed to resolve import \"zod\" from \"/vercel/path0/src/forms/signup.ts\"."
    },
    {
     "type": "diff",
     "quote": "+import { z } from \"zod\";"
    }
   ]
  },
  "fake": {
   "type": "log",
   "quote": "Error: Cannot find module 'yup'"
  }
 },
 {
  "id": "node-version",
  "title": "Node version mismatch",
  "tag": "runtime",
  "blurb": "A dependency upgrade needs a newer Node than the project builds on.",
  "commit": "c3d4e5f",
  "lastGood": "0ldc3d4",
  "env": [],
  "logs": "Installing dependencies...\nnpm warn EBADENGINE Unsupported engine {\nnpm warn EBADENGINE   package: 'sharp@0.34.1',\nnpm warn EBADENGINE   required: { node: '>=20.9.0' },\nnpm warn EBADENGINE   current: { node: 'v18.20.4', npm: '10.7.0' }\nnpm warn EBADENGINE }\nRunning \"npm run build\"\n> next build\nnode:internal/modules/cjs/loader:1228\n  throw err;\n  ^\nError: Cannot find module '../build/Release/sharp-linux-x64.node'\nError: Command \"npm run build\" exited with 1",
  "diff": "diff --git a/package.json b/package.json\n--- a/package.json\n+++ b/package.json\n@@ -10,3 +10,3 @@\n-    \"sharp\": \"^0.32.6\",\n+    \"sharp\": \"^0.34.1\",",
  "diagnosis": {
   "cause": "sharp was upgraded to ^0.34.1, which requires Node >=20.9.0, but the project builds on Node 18.20.4, so the native binary fails to load.",
   "fix": "Set the project's Node.js version to 20 or newer in the Vercel settings (or the engines field), then redeploy.",
   "confidence": "high",
   "evidence": [
    {
     "type": "log",
     "quote": "npm warn EBADENGINE   required: { node: '>=20.9.0' },"
    },
    {
     "type": "log",
     "quote": "npm warn EBADENGINE   current: { node: 'v18.20.4', npm: '10.7.0' }"
    },
    {
     "type": "diff",
     "quote": "+    \"sharp\": \"^0.34.1\","
    }
   ]
  },
  "fake": {
   "type": "log",
   "quote": "npm error engine Unsupported platform: win32"
  }
 },
 {
  "id": "case-sensitive-import",
  "title": "Case-sensitive import",
  "tag": "filesystem",
  "blurb": "Works on Windows and macOS. Breaks on Linux.",
  "commit": "d4e5f60",
  "lastGood": "0ldd4e5",
  "env": [],
  "logs": "Running \"npm run build\"\n> next build\nFailed to compile.\n\n./src/app/layout.tsx\nModule not found: Can't resolve '../components/Header'\n\nImport trace for requested module:\n./src/app/layout.tsx\nError: Command \"npm run build\" exited with 1",
  "diff": "diff --git a/src/components/Header.tsx b/src/components/header.tsx\nsimilarity index 100%\nrename from src/components/Header.tsx\nrename to src/components/header.tsx",
  "diagnosis": {
   "cause": "Header.tsx was renamed to header.tsx, but layout.tsx still imports '../components/Header'. Linux filesystems are case-sensitive, so the module can't be found.",
   "fix": "Make the import match the file name exactly (../components/header), or rename the file back to Header.tsx.",
   "confidence": "high",
   "evidence": [
    {
     "type": "log",
     "quote": "Module not found: Can't resolve '../components/Header'"
    },
    {
     "type": "diff",
     "quote": "rename to src/components/header.tsx"
    }
   ]
  },
  "fake": {
   "type": "log",
   "quote": "Module not found: Can't resolve 'react-dom/server'"
  }
 },
 {
  "id": "out-of-memory",
  "title": "Out of memory",
  "tag": "resources",
  "blurb": "A huge file got imported into a page.",
  "commit": "e5f6071",
  "lastGood": "0lde5f6",
  "env": [],
  "logs": "Running \"npm run build\"\n> next build\nCreating an optimized production build ...\n<--- Last few GCs --->\n[412:0x5a3b9c0]    61237 ms: Mark-sweep 4036.2 (4090.1) -> 4035.8 (4089.9) MB, 1423.1 / 0.0 ms  allocation failure; scavenge might not succeed\nFATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory\nError: Command \"npm run build\" exited with 134",
  "diff": "diff --git a/src/pages/report.tsx b/src/pages/report.tsx\n--- a/src/pages/report.tsx\n+++ b/src/pages/report.tsx\n@@ -1,3 +1,4 @@\n+import allCountries from \"../data/all-countries-full-geojson.json\";\n export default function Report() {\n-  return <div>Report</div>;\n+  return <div>{Object.keys(allCountries).length}</div>;\n }\ndiff --git a/src/data/all-countries-full-geojson.json b/src/data/all-countries-full-geojson.json\nnew file mode 100644\n--- /dev/null\n+++ b/src/data/all-countries-full-geojson.json\n@@ -0,0 +1 @@\n+{\"type\":\"FeatureCollection\",\"features\":[ ...412 MB of data truncated... ]}",
  "diagnosis": {
   "cause": "report.tsx now imports a very large GeoJSON file (all-countries-full-geojson.json), which pushes the build past the Node heap limit.",
   "fix": "Load the data at runtime or from an API instead of importing it, or trim the dataset. Raising the heap limit only postpones the failure.",
   "confidence": "high",
   "evidence": [
    {
     "type": "log",
     "quote": "FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory"
    },
    {
     "type": "diff",
     "quote": "+import allCountries from \"../data/all-countries-full-geojson.json\";"
    }
   ]
  },
  "fake": {
   "type": "log",
   "quote": "Error: ENOSPC: no space left on device"
  }
 },
 {
  "id": "lockfile-mismatch",
  "title": "Lockfile out of sync",
  "tag": "deps",
  "blurb": "package.json changed. The lockfile didn't.",
  "commit": "f607182",
  "lastGood": "0ldf607",
  "env": [],
  "logs": "Running \"npm ci\"\nnpm error code EUSAGE\nnpm error\nnpm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.\nnpm error Please update your lock file with `npm install` before continuing.\nnpm error\nnpm error Invalid: lock file's react@18.2.0 does not satisfy react@18.3.1\nError: Command \"npm ci\" exited with 1",
  "diff": "diff --git a/package.json b/package.json\n--- a/package.json\n+++ b/package.json\n@@ -8,3 +8,3 @@\n-    \"react\": \"18.2.0\",\n+    \"react\": \"18.3.1\",",
  "diagnosis": {
   "cause": "package.json bumped react to 18.3.1, but package-lock.json still pins 18.2.0, so npm ci refuses to install.",
   "fix": "Run npm install locally to regenerate package-lock.json, commit it, and redeploy.",
   "confidence": "high",
   "evidence": [
    {
     "type": "log",
     "quote": "npm error Invalid: lock file's react@18.2.0 does not satisfy react@18.3.1"
    },
    {
     "type": "diff",
     "quote": "+    \"react\": \"18.3.1\","
    }
   ]
  },
  "fake": {
   "type": "log",
   "quote": "npm error 404 Not Found - GET https://registry.npmjs.org/react"
  }
 },
 {
  "id": "red-herring-lint",
  "title": "Lint error under noise",
  "tag": "signal vs noise",
  "blurb": "Three deprecation warnings up top. The real failure is below them.",
  "commit": "0718293",
  "lastGood": "0ld0718",
  "env": [],
  "logs": "Cloning github.com/acme/app (Branch: main, Commit: 0718293)\nnpm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory.\nnpm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported\nnpm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported\nRunning \"npm run build\"\n> next build\nFailed to compile.\n\n./src/components/Chart.tsx\n12:7  Error: 'colors' is assigned a value but never used.  @typescript-eslint/no-unused-vars\n\nTreating warnings as errors because process.env.CI = true.\nError: Command \"npm run build\" exited with 1",
  "diff": "diff --git a/src/components/Chart.tsx b/src/components/Chart.tsx\n--- a/src/components/Chart.tsx\n+++ b/src/components/Chart.tsx\n@@ -9,3 +9,4 @@\n+  const colors = [\"#f00\", \"#0f0\"];\n   return <svg />;\ndiff --git a/package-lock.json b/package-lock.json\n--- a/package-lock.json\n+++ b/package-lock.json\n@@ -1,3 +1,3 @@\n-      \"version\": \"7.2.3\",\n+      \"version\": \"7.2.4\",",
  "diagnosis": {
   "cause": "Chart.tsx declares an unused variable, colors. The deprecation warnings are noise. Because CI=true, lint warnings are treated as errors and the build fails.",
   "fix": "Remove the unused colors variable (or use it), or relax the lint rule for CI builds.",
   "confidence": "high",
   "evidence": [
    {
     "type": "log",
     "quote": "12:7  Error: 'colors' is assigned a value but never used.  @typescript-eslint/no-unused-vars"
    },
    {
     "type": "log",
     "quote": "Treating warnings as errors because process.env.CI = true."
    },
    {
     "type": "diff",
     "quote": "+  const colors = [\"#f00\", \"#0f0\"];"
    }
   ]
  },
  "fake": {
   "type": "log",
   "quote": "Error: inflight@1.0.6 leaks memory and crashed the build"
  }
 },
 {
  "id": "transient-network",
  "title": "Flaky network",
  "tag": "not your code",
  "blurb": "The commit is innocent. The registry timed out.",
  "commit": "182930a",
  "lastGood": "0ld1829",
  "env": [],
  "logs": "Installing dependencies...\nnpm error code ETIMEDOUT\nnpm error syscall connect\nnpm error errno ETIMEDOUT\nnpm error network request to https://registry.npmjs.org/lodash failed, reason: connect ETIMEDOUT 104.16.1.35:443\nnpm error network This is a problem related to network connectivity.\nError: Command \"npm install\" exited with 1",
  "diff": "diff --git a/README.md b/README.md\n--- a/README.md\n+++ b/README.md\n@@ -1 +1,2 @@\n # app\n+Docs update.",
  "diagnosis": {
   "cause": "npm could not reach registry.npmjs.org (ETIMEDOUT). The commit only touched the README, so this is a transient network failure, not a code problem.",
   "fix": "Redeploy. If it keeps failing, check npm's status page.",
   "confidence": "high",
   "evidence": [
    {
     "type": "log",
     "quote": "npm error network request to https://registry.npmjs.org/lodash failed, reason: connect ETIMEDOUT 104.16.1.35:443"
    }
   ]
  },
  "fake": {
   "type": "log",
   "quote": "npm error ERESOLVE unable to resolve dependency tree"
  }
 }
];
