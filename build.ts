import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const handlers = [
  { name: 'meta-verify', entry: 'src/handlers/webhooks/meta-verify.ts' },
  { name: 'meta-ingest', entry: 'src/handlers/webhooks/meta-ingest.ts' },
  { name: 'process-comment', entry: 'src/handlers/workers/process-comment.ts' },
  { name: 'list-automations', entry: 'src/handlers/automations/list-automations.ts' },
  { name: 'create-automation', entry: 'src/handlers/automations/create-automation.ts' },
  { name: 'delete-automation', entry: 'src/handlers/automations/delete-automation.ts' },
  { name: 'oauth-start', entry: 'src/handlers/instagram/oauth-start.ts' },
  { name: 'oauth-callback', entry: 'src/handlers/instagram/oauth-callback.ts' },
  { name: 'get-session', entry: 'src/handlers/auth/get-session.ts' },
];

async function createZip(sourceFile: string, outZipPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.file(sourceFile, { name: 'index.mjs' });
    archive.finalize();
  });
}

async function run() {
  const zipsDir = path.resolve('zips');
  const distDir = path.resolve('dist');

  if (!fs.existsSync(zipsDir)) fs.mkdirSync(zipsDir, { recursive: true });
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  console.log('⚡ Building Lambda handlers with esbuild...');

  for (const h of handlers) {
    const handlerDist = path.join(distDir, h.name);
    if (!fs.existsSync(handlerDist)) fs.mkdirSync(handlerDist, { recursive: true });

    const outFile = path.join(handlerDist, 'index.mjs');

    await build({
      entryPoints: [h.entry],
      bundle: true,
      platform: 'node',
      target: 'node22',
      format: 'esm',
      outfile: outFile,
      minify: true,
      sourcemap: true,
      external: ['@aws-sdk/*'], // Lambda node22 runtime includes AWS SDK v3
    });

    const zipFile = path.join(zipsDir, `${h.name}.zip`);
    await createZip(outFile, zipFile);

    const stats = fs.statSync(zipFile);
    console.log(`✅ ${h.name.padEnd(20)} -> zips/${h.name}.zip (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  console.log('\n🎉 All Lambda zips successfully created!');
}

run().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
