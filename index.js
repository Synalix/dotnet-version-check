const fs = require('fs');
const path = require('path');

function getInput(name) {
  const envKey = `INPUT_${name.toUpperCase().replace(/-/g, '_')}`;
  const val = process.env[envKey];
  console.log(`DEBUG: Looking for env var: ${envKey}`);
  console.log(`DEBUG: Value found: "${val}"`);
  if (!val) {
    console.error(`::error::Missing required input: ${name}`);
    process.exit(1);
  }
  return val.trim().replace(/^['"]|['"]$/g, '');
}

function setFailed(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

function info(message) {
  console.log(message);
}

console.log('DEBUG: All INPUT_ environment variables:');
Object.keys(process.env)
  .filter(k => k.startsWith('INPUT_'))
  .forEach(k => console.log(`  ${k}="${process.env[k]}"`));

const csprojPath = getInput('csproj-path');

const githubRef = process.env.GITHUB_REF || '';
const tagMatch = githubRef.match(/^refs\/tags\/(.+)$/);

if (!tagMatch) {
  setFailed(`GITHUB_REF does not point to a tag: "${githubRef}". Make sure this action runs on a release event.`);
}

const rawTag = tagMatch[1];
const tagVersion = rawTag.startsWith('v') ? rawTag.slice(1) : rawTag;

info(`Release tag: ${rawTag} (normalized: ${tagVersion})`);

const fullPath = path.resolve(process.env.GITHUB_WORKSPACE || '.', csprojPath);

if (!fs.existsSync(fullPath)) {
  setFailed(`Could not find .csproj at path: ${fullPath}`);
}

const csprojContent = fs.readFileSync(fullPath, 'utf8');

const versionMatch = csprojContent.match(/<InformationalVersion>([^<]+)<\/InformationalVersion>/);

if (!versionMatch) {
  setFailed(`No <InformationalVersion> tag found in ${csprojPath}. Make sure it exists in a <PropertyGroup>.`);
}

const csprojVersion = versionMatch[1].trim();
info(`InformationalVersion in .csproj: ${csprojVersion}`);

if (csprojVersion !== tagVersion) {
  setFailed(
    `Version mismatch!\n` +
    `  .csproj InformationalVersion : ${csprojVersion}\n` +
    `  Release tag (normalized)      : ${tagVersion}\n` +
    `Update <InformationalVersion> in ${csprojPath} to match the release tag before publishing.`
  );
}

info(`✅ Version match confirmed: ${csprojVersion}`);