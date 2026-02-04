// Expo config plugin that adds custom workout Live Activity files.
// Runs AFTER expo-live-activity to override its generated templates
// and add interactive widget support (App Groups, App Intents, native bridge).
//
// This plugin ensures custom native code survives `npx expo prebuild --clean`.

const {
  withXcodeProject,
  withEntitlementsPlist,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const APP_GROUP_ID = 'group.com.aligntracker.app';

// Source directories for custom native files
const NATIVE_DIR = path.resolve(__dirname, '..', 'native');

function withWorkoutWidget(config) {
  // 1. Add App Groups to main app entitlements
  config = withAppGroupsEntitlement(config);

  // 2. Copy custom files + update widget entitlements + fix Image+dynamic.swift
  config = withCustomNativeFiles(config);

  // 3. Add new files to Xcode project
  config = withCustomXcodeFiles(config);

  return config;
}

// Add App Groups to main app entitlements
function withAppGroupsEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [APP_GROUP_ID];
    return config;
  });
}

// Copy custom Swift files and update widget entitlements
function withCustomNativeFiles(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;
      const liveActivityDir = path.join(platformRoot, 'LiveActivity');
      const alignDir = path.join(platformRoot, 'Align');

      // Copy/overwrite LiveActivity custom files
      const liveActivityFiles = [
        'LiveActivityView.swift',
        'LiveActivityWidget.swift',
        'WorkoutWidgetData.swift',
        'CompleteSetIntent.swift',
      ];

      for (const file of liveActivityFiles) {
        const src = path.join(NATIVE_DIR, 'LiveActivity', file);
        const dest = path.join(liveActivityDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }

      // Copy Align custom files
      const alignFiles = ['WorkoutWidgetBridge.swift', 'WorkoutWidgetBridge.m'];

      for (const file of alignFiles) {
        const src = path.join(NATIVE_DIR, 'Align', file);
        const dest = path.join(alignDir, file);
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

      // Update LiveActivity.entitlements with App Groups
      const widgetEntPath = path.join(liveActivityDir, 'LiveActivity.entitlements');
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

      return config;
    },
  ]);
}

// Add custom files to Xcode project build targets
function withCustomXcodeFiles(config) {
  return withXcodeProject(config, (config) => {
    const proj = config.modResults;

    // Helper: generate a unique UUID that doesn't conflict
    const genUuid = () => proj.generateUuid();

    // Find the LiveActivity native target
    const liveActivityTarget = findNativeTarget(proj, 'LiveActivity');
    const alignTarget = findNativeTarget(proj, 'Align');

    if (!liveActivityTarget) {
      console.warn('[withWorkoutWidget] Could not find LiveActivity target in pbxproj');
      return config;
    }

    // Add WorkoutWidgetData.swift to LiveActivity target
    addSourceFileToTarget(proj, liveActivityTarget, 'WorkoutWidgetData.swift', {
      group: 'LiveActivity',
    });

    // Add CompleteSetIntent.swift to LiveActivity target
    addSourceFileToTarget(proj, liveActivityTarget, 'CompleteSetIntent.swift', {
      group: 'LiveActivity',
    });

    // Add WorkoutWidgetBridge.swift to Align target
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
    if (target.name === targetName || target.name === `"${targetName}"`) {
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
      // Already exists, check if it's in the build phase
      return;
    }
  }

  // Create file reference
  const fileRefUuid = proj.generateUuid();
  proj.pbxFileReferenceSection()[fileRefUuid] = {
    isa: 'PBXFileReference',
    lastKnownFileType: lastKnownFileType,
    name: fileName,
    path: effectivePath,
    sourceTree: '"<group>"',
  };
  proj.pbxFileReferenceSection()[`${fileRefUuid}_comment`] = fileName;

  // Add to appropriate PBXGroup
  if (group) {
    const groups = proj.pbxGroupByName(group);
    if (groups) {
      // pbxGroupByName returns the first match
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

  // Add to target's Sources build phase
  const buildPhases = targetInfo.target.buildPhases;
  for (const phase of buildPhases) {
    const phaseObj = proj.pbxBuildPhaseObj(phase.value);
    if (phaseObj && phaseObj.isa === 'PBXSourcesBuildPhase') {
      phaseObj.files.push({
        value: buildFileUuid,
        comment: `${fileName} in Sources`,
      });
      break;
    }
  }
}

module.exports = withWorkoutWidget;
