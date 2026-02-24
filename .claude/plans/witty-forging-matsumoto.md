# Fix EAS Build: LiveActivity App Groups capability being disabled

## Root Cause

The `expo-live-activity` plugin registers the LiveActivity extension with EAS via `config.extra.eas.build.experimental.ios.appExtensions` but always passes **empty entitlements `{}`**. The App Groups code in the plugin is literally commented out. So every time EAS Build runs, it syncs this empty config to the Apple Developer Portal and **disables** App Groups for the LiveActivity identifier — even if you manually enable it.

## Fix (2 changes)

### 1. Move `withWorkoutWidget.js` after `expo-live-activity` in `app.json`

Currently the plugin order is:

```
"./plugins/withWorkoutWidget.js",
"expo-live-activity",
```

Swap to:

```
"expo-live-activity",
"./plugins/withWorkoutWidget.js",
```

This ensures `expo-live-activity` sets up the base EAS extension config first, then our plugin can modify it.

### 2. Add App Groups to EAS extension config in `withWorkoutWidget.js`

In the main `withWorkoutWidget()` function, after the existing steps, add code to patch `config.extra.eas.build.experimental.ios.appExtensions` to include the App Groups entitlement for the LiveActivity target:

```js
// In withWorkoutWidget(), patch the EAS extension config
const extensions = config?.extra?.eas?.build?.experimental?.ios?.appExtensions;
if (extensions) {
  const laExt = extensions.find((e) => e.targetName === 'LiveActivity');
  if (laExt) {
    laExt.entitlements = laExt.entitlements || {};
    laExt.entitlements['com.apple.security.application-groups'] = [APP_GROUP_ID];
  }
}
```

This tells EAS that the LiveActivity extension needs the App Groups capability, so EAS will **enable** (not disable) it on the Apple Developer Portal and generate a provisioning profile that includes it.

## Files to modify

1. `app.json` — swap plugin order
2. `plugins/withWorkoutWidget.js` — add EAS extension config patching

## After the fix

Run: `eas build --platform ios --profile production --clear-cache`
EAS should now show `Enabled: App Groups` instead of `Disabled: App Groups`.
