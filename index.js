const fs = require('fs');
const path = require('path');

function getInput(name) {
  const val = process.env[`INPUT_${name.toUpperCase().replace(/-/g, '_')}`];
  if (!val) {
    console.error(`::error::Missing required input: ${name}`);
    process.exit(1);
  }
  return val.trim();
}

function setFailed(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

function info(message) {
  console.log(message);
}

// Get inputs
const csprojPath = getInput('csproj-path');

// Get release tag from GITHUB_REF (refs/tags/v1.0.0 or refs/tags/1.0.0)
const githubRef = process.env.GITHUB_REF || '';
const tagMatch = githubRef.match(/^refs\/tags\/(.+)$/);

if (!tagMatch) {
  setFailed(`GITHUB_REF does not point to a tag: "${githubRef}". Make sure this action runs on a release event.`);
}

const rawTag = tagMatch[1];
// Strip leading 'v' if present (v1.0.0 -> 1.0.0)
const tagVersion = rawTag.startsWith('v') ? rawTag.slice(1) : rawTag;

info(`Release tag: ${rawTag} (normalized: ${tagVersion})`);

// Read .csproj
const fullPath = path.resolve(process.env.GITHUB_WORKSPACE || '.', csprojPath);

if (!fs.existsSync(fullPath)) {
  setFailed(`Could not find .csproj at path: ${fullPath}`);
}

const csprojContent = fs.readFileSync(fullPath, 'utf8');

// Extract <InformationalVersion>
const versionMatch = csprojContent.match(/<InformationalVersion>([^<]+)<\/InformationalVersion>/);

if (!versionMatch) {
  setFailed(`No <InformationalVersion> tag found in ${csprojPath}. Make sure it exists in a <PropertyGroup>.`);
}

const csprojVersion = versionMatch[1].trim();
info(`InformationalVersion in .csproj: ${csprojVersion}`);

// Compare
if (csprojVersion !== tagVersion) {
  setFailed(
    `Version mismatch!\n` +
    `  .csproj InformationalVersion : ${csprojVersion}\n` +
    `  Release tag (normalized)      : ${tagVersion}\n` +
    `Update <InformationalVersion> in ${csprojPath} to match the release tag before publishing.`
  );
}

info(`✅ Version match confirmed: ${csprojVersion}`);
