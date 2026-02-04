// Expo config plugin that adds custom workout Live Activity files.
// Runs AFTER expo-live-activity to override its generated templates
// and add interactive widget support (App Groups, App Intents, native bridge).
//
// Strategy: expo-live-activity creates the LiveActivity target and copies its
// template files during its withXcodeProject callback. Our withXcodeProject
// callback runs AFTER (since we're listed later in plugins array), so we
// overwrite those files with our custom versions that include data models
// and intent code inline. We also add WorkoutWidgetBridge files to the
// main Align target.
//
// This plugin ensures custom native code survives `npx expo prebuild --clean`.

const { withXcodeProject, withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const APP_GROUP_ID = 'group.com.aligntracker.app';

// Source directories for custom native files
const NATIVE_DIR = path.resolve(__dirname, '..', 'native');

function withWorkoutWidget(config) {
  // 1. Add App Groups to main app entitlements
  config = withAppGroupsEntitlement(config);

  // 2. Add bridge files to Align target + overwrite LiveActivity files
  //    (must be in withXcodeProject so it runs AFTER expo-live-activity's
  //    withXcodeProject which copies its template files)
  config = withCustomXcodeFiles(config);

  // 3. Update widget entitlements with App Groups
  //    (must be in withInfoPlist because expo-live-activity writes entitlements
  //    via withInfoPlist which runs AFTER withXcodeProject)
  config = withWidgetEntitlements(config);

  return config;
}

// Add App Groups to main app entitlements
function withAppGroupsEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [APP_GROUP_ID];
    return config;
  });
}

// Add custom files to Xcode project and overwrite expo-live-activity templates.
// This runs in withXcodeProject AFTER expo-live-activity's withXcodeProject,
// so our file copies overwrite its template files.
function withCustomXcodeFiles(config) {
  return withXcodeProject(config, (config) => {
    const proj = config.modResults;
    const platformRoot = config.modRequest.platformProjectRoot;
    const liveActivityDir = path.join(platformRoot, 'LiveActivity');
    const alignDir = path.join(platformRoot, 'Align');

    // Ensure destination directories exist (needed for prebuild --clean)
    fs.mkdirSync(liveActivityDir, { recursive: true });
    fs.mkdirSync(alignDir, { recursive: true });

    // Overwrite LiveActivity files with our custom versions.
    // These files are already in the build phase (added by expo-live-activity).
    // Our versions include data models and intent code inline.
    const liveActivityFiles = ['LiveActivityView.swift', 'LiveActivityWidget.swift'];

    for (const file of liveActivityFiles) {
      const src = path.join(NATIVE_DIR, 'LiveActivity', file);
      const dest = path.join(liveActivityDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    }

    // Update Image+dynamic.swift to use our App Group ID
    const imageDynamicPath = path.join(liveActivityDir, 'Image+dynamic.swift');
    if (fs.existsSync(imageDynamicPath)) {
      let content = fs.readFileSync(imageDynamicPath, 'utf8');
      content = content.replace(/group\.expoLiveActivity\.sharedData/g, APP_GROUP_ID);
      fs.writeFileSync(imageDynamicPath, content);
    }

    // Copy bridge files to Align directory
    const alignFiles = ['WorkoutWidgetBridge.swift', 'WorkoutWidgetBridge.m'];
    for (const file of alignFiles) {
      const src = path.join(NATIVE_DIR, 'Align', file);
      const dest = path.join(alignDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    }

    // Add WorkoutWidgetBridge files to the Align target build phase
    const alignTarget = findNativeTarget(proj, 'Align');
    if (alignTarget) {
      addSourceFileToTarget(proj, alignTarget, 'WorkoutWidgetBridge.swift', {
        group: 'Align',
        filePath: 'Align/WorkoutWidgetBridge.swift',
      });
      addSourceFileToTarget(proj, alignTarget, 'WorkoutWidgetBridge.m', {
        group: 'Align',
        filePath: 'Align/WorkoutWidgetBridge.m',
        fileType: 'sourcecode.c.objc',
      });
    } else {
      console.warn('[withWorkoutWidget] Could not find Align target');
    }

    return config;
  });
}

// Update LiveActivity.entitlements with App Groups.
// expo-live-activity writes its entitlements via withInfoPlist, so we use
// the same mod type to ensure our write happens after theirs.
// With our plugin listed FIRST, our callback runs LAST (inner position).
function withWidgetEntitlements(config) {
  return withInfoPlist(config, (config) => {
    const platformRoot = config.modRequest.platformProjectRoot;
    const liveActivityDir = path.join(platformRoot, 'LiveActivity');
    const widgetEntPath = path.join(liveActivityDir, 'LiveActivity.entitlements');

    if (fs.existsSync(liveActivityDir)) {
      const entitlementContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.application-groups</key>
    <array>
      <string>${APP_GROUP_ID}</string>
    </array>
  </dict>
</plist>
`;
      fs.writeFileSync(widgetEntPath, entitlementContent);
    }

    return config;
  });
}

// Find a PBXNativeTarget by name
function findNativeTarget(proj, targetName) {
  const targets = proj.pbxNativeTargetSection();
  for (const key in targets) {
    if (key.endsWith('_comment')) continue;
    const target = targets[key];
    if (!target || typeof target !== 'object') continue;
    const name = target.name;
    if (name === targetName || name === `"${targetName}"` || name === `'${targetName}'`) {
      return { uuid: key, target };
    }
  }
  return null;
}

// Add a source file to a specific target's Sources build phase
function addSourceFileToTarget(proj, targetInfo, fileName, opts = {}) {
  const { group, filePath, fileType } = opts;
  const isSwift = fileName.endsWith('.swift');
  const lastKnownFileType = fileType || (isSwift ? 'sourcecode.swift' : 'sourcecode.c.objc');
  const effectivePath = filePath || fileName;

  // Check if file reference already exists
  const fileRefs = proj.pbxFileReferenceSection();
  for (const key in fileRefs) {
    if (key.endsWith('_comment')) continue;
    const ref = fileRefs[key];
    if (ref && (ref.name === fileName || ref.name === `"${fileName}"`)) {
      return;
    }
  }

  // Create file reference
  const fileRefUuid = proj.generateUuid();
  fileRefs[fileRefUuid] = {
    isa: 'PBXFileReference',
    lastKnownFileType: lastKnownFileType,
    name: fileName,
    path: effectivePath,
    sourceTree: '"<group>"',
  };
  fileRefs[`${fileRefUuid}_comment`] = fileName;

  // Add to appropriate PBXGroup
  if (group) {
    const groups = proj.pbxGroupByName(group);
    if (groups) {
      groups.children.push({
        value: fileRefUuid,
        comment: fileName,
      });
    }
  }

  // Create build file
  const buildFileUuid = proj.generateUuid();
  proj.pbxBuildFileSection()[buildFileUuid] = {
    isa: 'PBXBuildFile',
    fileRef: fileRefUuid,
    fileRef_comment: fileName,
  };
  proj.pbxBuildFileSection()[`${buildFileUuid}_comment`] = `${fileName} in Sources`;

  // Find the Sources build phase in the target and add our file
  const buildPhases = targetInfo.target.buildPhases;
  if (!buildPhases) return;

  for (const phase of buildPhases) {
    const phaseUuid = phase.value;

    // Look up the build phase object in the hash directly
    const objects = proj.hash.project.objects;
    const sourcesPhases = objects['PBXSourcesBuildPhase'];
    if (sourcesPhases && sourcesPhases[phaseUuid]) {
      const phaseObj = sourcesPhases[phaseUuid];
      if (phaseObj.isa === 'PBXSourcesBuildPhase') {
        phaseObj.files.push({
          value: buildFileUuid,
          comment: `${fileName} in Sources`,
        });
        return;
      }
    }
  }
}

module.exports = withWorkoutWidget;
