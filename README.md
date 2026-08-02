# SmartRosary Intentions

Canonical intention definitions for SmartRosary intention NVS packages and
standalone preview fixtures.

This repository owns the intention content. The intentions editor owns manual
editing, import/export, NVS encoding, validation, and BLE upload behavior.

## Contents

- `packages/*.json` contains publishable intention package source data.
- `intentions/*.js` contains lightweight localized preview fixtures used by
  standalone mockup and how-to pages.
- `intentions.js` registers the browser preview fixture loader.

## Generate Published Binaries

From the intentions editor repository:

```sh
node scripts/generate-intentions-binaries.mjs ../smartrosary-web-installer/intentions
```

The editor script reads definitions from this sibling repository by default.
Set `SMARTROSARY_INTENTIONS_DIR` to use a different checkout.

## Consumers

- `smartrosary-intentions-editor` reads package definitions when generating
  NVS intention binaries.
- `smartrosary-web-installer` publishes generated
  `intentions/nvs-intentions-*.bin` packages.
- `smartrosary-app` downloads the published installer packages.
- `smartrosary-mockups` and `smartrosary-howto` keep preview fixture copies
  synced from this repository for standalone static pages.
