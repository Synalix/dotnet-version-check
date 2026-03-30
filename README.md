# dotnet-version-check

A GitHub Action that verifies the `<InformationalVersion>` in your `.csproj` matches the GitHub Release tag before a release goes out.

Prevents accidentally publishing a release where the tag (e.g. `v1.2.0`) doesn't match the version baked into the binary (`1.1.0`).

## Usage

```yaml
name: Release

on:
  release:
    types: [published]

jobs:
  version-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check .NET version matches release tag
        uses: Synalix/dotnet-version-check@v1
        with:
          csproj-path: 'ReWindows/ReWindows.csproj'
```

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `csproj-path` | ✅ | Relative path to your `.csproj` file from the repo root |

## How it works

1. Reads the release tag from `GITHUB_REF` (e.g. `refs/tags/v1.2.0`)
2. Strips the leading `v` if present → `1.2.0`
3. Parses `<InformationalVersion>` from the specified `.csproj`
4. Fails the workflow with a clear error if they don't match

## Example .csproj

```xml
<PropertyGroup>
  <InformationalVersion>1.2.0</InformationalVersion>
</PropertyGroup>
```

## Example error output

```
❌ Version mismatch!
  .csproj InformationalVersion : 1.1.0
  Release tag (normalized)      : 1.2.0
Update <InformationalVersion> in ReWindows/ReWindows.csproj to match the release tag before publishing.
```

## License

MIT
