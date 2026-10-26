---
'eas-cli': patch
---

Detect `@expo/cli` when npm installs it under `node_modules/expo/node_modules`, so `eas update` uses the versioned `expo export` command instead of the legacy one that warns `--non-interactive is not supported`.
