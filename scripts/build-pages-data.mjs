import { promises as fs } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
const outputPath = path.join(repoRoot, 'intentions-data.json');
const siteDirArg = process.argv.find((arg) => arg.startsWith('--site-dir='));
const siteDir = siteDirArg
  ? path.resolve(repoRoot, siteDirArg.split('=').slice(1).join('='))
  : null;

if (siteDir && (siteDir === repoRoot || !siteDir.startsWith(`${repoRoot}${path.sep}`))) {
  throw new Error('--site-dir must point to a staging directory inside this repository');
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function readJsonFiles(dir) {
  if (!(await exists(dir))) return [];
  const names = (await fs.readdir(dir)).filter((name) => name.endsWith('.json')).sort();
  return Promise.all(names.map(async (name) => ({
    id: path.basename(name, '.json'),
    file: path.relative(repoRoot, path.join(dir, name)),
    json: await readJson(path.join(dir, name)),
  })));
}

function entryCountText(count) {
  return count === 1 ? '1 intention' : `${count} intentions`;
}

function normalizeSingle(sourceId, file, item) {
  const id = item.id || sourceId;
  const title = item.title || item.label || id;
  const desc = item.desc || item.description || '';
  return {
    id,
    label: item.label || title,
    type: 'intention',
    typeLabel: 'Single intention',
    source: file,
    filename: item.filename || `nvs-intentions-${id}.bin`,
    format: item.format || 'smartrosary-intention-v1',
    count: 1,
    countLabel: entryCountText(1),
    entries: [{ index: 1, title, desc }],
  };
}

function normalizePackage(sourceId, file, pkg) {
  const id = pkg.id || sourceId;
  const titles = Array.isArray(pkg.titles) ? pkg.titles.map((v) => String(v ?? '')) : [];
  const descs = Array.isArray(pkg.descs) ? pkg.descs.map((v) => String(v ?? '')) : [];
  const count = Math.max(Number(pkg.numIntentions) || 0, titles.length, descs.length);
  const entries = Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    title: titles[i] || `Intention ${i + 1}`,
    desc: descs[i] || '',
  }));

  return {
    id,
    label: pkg.label || id,
    type: 'package',
    typeLabel: 'Package',
    source: file,
    filename: pkg.filename || `nvs-intentions-${id}.bin`,
    format: pkg.format || 'smartrosary-intentions-v1',
    count,
    countLabel: entryCountText(count),
    entries,
  };
}

async function copyFileIntoSite(relativeFile) {
  if (!siteDir) return;
  const source = path.join(repoRoot, relativeFile);
  const target = path.join(siteDir, relativeFile);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
}

async function copyPublicFiles() {
  if (!siteDir) return;
  await fs.rm(siteDir, { recursive: true, force: true });
  await fs.mkdir(siteDir, { recursive: true });
  await copyFileIntoSite('index.html');
  await copyFileIntoSite('intentions-data.json');
}

async function build() {
  const singles = (await readJsonFiles(path.join(repoRoot, 'intentions')))
    .map(({ id, file, json }) => normalizeSingle(id, file, json));
  const packages = (await readJsonFiles(path.join(repoRoot, 'packages')))
    .map(({ id, file, json }) => normalizePackage(id, file, json));

  const items = [...singles, ...packages].sort((a, b) => {
    const byType = a.type.localeCompare(b.type);
    if (byType !== 0) return byType;
    return a.label.localeCompare(b.label, 'pl');
  });
  const totalEntries = items.reduce((sum, item) => sum + item.count, 0);

  const data = {
    summary: {
      items: items.length,
      singles: singles.length,
      packages: packages.length,
      entries: totalEntries,
    },
    items,
  };

  await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`);
  await copyPublicFiles();
  console.log(`Wrote ${path.relative(repoRoot, outputPath)} with ${items.length} items.`);
  if (siteDir) console.log(`Prepared ${path.relative(repoRoot, siteDir)} for GitHub Pages.`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
