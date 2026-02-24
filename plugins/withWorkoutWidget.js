// Expo config plugin that adds custom workout Live Activity files
// and the TikTok Share Extension target.
// Runs AFTER expo-live-activity to override its generated templates
// and add interactive widget support (App Groups, App Intents, native bridge).
//
// Strategy: expo-live-activity creates the LiveActivity target and copies its
// template files during prebuild. We use withDangerousMod to overwrite those
// files with our custom versions AFTER all other mods complete. We also add
// WorkoutWidgetBridge files to the main Align target via withXcodeProject.
//
// This plugin ensures custom native code survives `npx expo prebuild --clean`.

const { withXcodeProject, withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const APP_GROUP_ID = 'group.com.aligntracker.app';
const SHARE_EXT_BUNDLE_ID = 'com.aligntracker.app.ShareExtension';
const SHARE_EXT_TARGET_NAME = 'ShareExtension';

// Source directories for custom native files
const NATIVE_DIR = path.resolve(__dirname, '..', 'native');

function withWorkoutWidget(config) {
  // 1. Add App Groups to main app entitlements
  config = withAppGroupsEntitlement(config);

  // 2. Add bridge files to Align target + create ShareExtension target in Xcode project
  config = withCustomXcodeFiles(config);

  // 3. Copy custom Swift files + update widget/extension entitlements
  //    Both done in withInfoPlist which runs AFTER withXcodeProject,
  //    ensuring our files overwrite expo-live-activity's templates
  config = withCustomFilesAndEntitlements(config);

  // 4. Tell EAS that the LiveActivity and ShareExtension need App Groups.
  //    expo-live-activity registers the extension with empty entitlements {},
  //    which causes EAS to DISABLE App Groups on the Apple Developer Portal.
  //    We patch it here so EAS enables App Groups and generates a valid profile.
  if (!config.extra) config.extra = {};
  if (!config.extra.eas) config.extra.eas = {};
  if (!config.extra.eas.build) config.extra.eas.build = {};
  if (!config.extra.eas.build.experimental) config.extra.eas.build.experimental = {};
  if (!config.extra.eas.build.experimental.ios) config.extra.eas.build.experimental.ios = {};
  if (!config.extra.eas.build.experimental.ios.appExtensions) {
    config.extra.eas.build.experimental.ios.appExtensions = [];
  }

  const extensions = config.extra.eas.build.experimental.ios.appExtensions;

  // Patch LiveActivity extension
  const laExt = extensions.find((e) => e.targetName === 'LiveActivity');
  if (laExt) {
    laExt.entitlements = laExt.entitlements || {};
    laExt.entitlements['com.apple.security.application-groups'] = [APP_GROUP_ID];
  }

  // Register ShareExtension with EAS (add if not already present)
  const existingShareExt = extensions.find((e) => e.targetName === SHARE_EXT_TARGET_NAME);
  if (!existingShareExt) {
    extensions.push({
      targetName: SHARE_EXT_TARGET_NAME,
      bundleIdentifier: SHARE_EXT_BUNDLE_ID,
      entitlements: {
        'com.apple.security.application-groups': [APP_GROUP_ID],
      },
    });
  }

  return config;
}

// Add App Groups to main app entitlements
function withAppGroupsEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [APP_GROUP_ID];
    return config;
  });
}

// Copy custom Swift files + update widget/extension entitlements.
// Uses withInfoPlist which runs AFTER withXcodeProject in the mod pipeline,
// ensuring our files overwrite expo-live-activity's template copies.
function withCustomFilesAndEntitlements(config) {
  return withInfoPlist(config, (config) => {
    const platformRoot = config.modRequest.platformProjectRoot;
    const liveActivityDir = path.join(platformRoot, 'LiveActivity');
    const alignDir = path.join(platformRoot, 'Align');
    const shareExtDir = path.join(platformRoot, SHARE_EXT_TARGET_NAME);

    fs.mkdirSync(liveActivityDir, { recursive: true });
    fs.mkdirSync(alignDir, { recursive: true });
    fs.mkdirSync(shareExtDir, { recursive: true });

    // Overwrite LiveActivity template files with our custom versions
    const liveActivityFiles = [
      'LiveActivityView.swift',
      'LiveActivityWidget.swift',
      'Image+dynamic.swift',
    ];
    for (const file of liveActivityFiles) {
      const src = path.join(NATIVE_DIR, 'LiveActivity', file);
      const dest = path.join(liveActivityDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`[withWorkoutWidget] Copied custom ${file}`);
      }
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

    // Copy ShareExtension Swift file
    const shareExtSrc = path.join(
      NATIVE_DIR,
      'ShareExtension',
      'ShareExtensionViewController.swift'
    );
    const shareExtDest = path.join(shareExtDir, 'ShareExtensionViewController.swift');
    if (fs.existsSync(shareExtSrc)) {
      fs.copyFileSync(shareExtSrc, shareExtDest);
      console.log('[withWorkoutWidget] Copied ShareExtensionViewController.swift');
    }

    // Write widget entitlements with App Groups
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

    // Write ShareExtension entitlements with App Groups
    const shareEntPath = path.join(shareExtDir, `${SHARE_EXT_TARGET_NAME}.entitlements`);
    fs.writeFileSync(shareEntPath, entitlementContent);
    console.log('[withWorkoutWidget] Wrote ShareExtension.entitlements');

    // Write ShareExtension Info.plist
    const shareInfoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleDisplayName</key>
  <string>Align</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key>
  <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
  <key>CFBundleShortVersionString</key>
  <string>$(MARKETING_VERSION)</string>
  <key>CFBundleVersion</key>
  <string>$(CURRENT_PROJECT_VERSION)</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionAttributes</key>
    <dict>
      <key>NSExtensionActivationRule</key>
      <dict>
        <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
        <integer>1</integer>
        <key>NSExtensionActivationSupportsText</key>
        <true/>
      </dict>
    </dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.share-services</string>
    <key>NSExtensionPrincipalClass</key>
    <string>$(PRODUCT_MODULE_NAME).ShareExtensionViewController</string>
  </dict>
</dict>
</plist>
`;
    const shareInfoPath = path.join(shareExtDir, 'Info.plist');
    fs.writeFileSync(shareInfoPath, shareInfoPlist);
    console.log('[withWorkoutWidget] Wrote ShareExtension Info.plist');

    // Replace expo-live-activity's Helpers.swift with our cached version.
    // The original re-downloads images on every update with a new UUID filename.
    // Our version caches by URL (uses lastPathComponent as stable filename)
    // so the same exercise image is only downloaded once.
    const helpersPath = path.join(
      __dirname,
      '..',
      'node_modules',
      'expo-live-activity',
      'ios',
      'Helpers.swift'
    );
    if (fs.existsSync(helpersPath)) {
      const cachedHelpers = `import Foundation

func resolveImage(from string: String) async throws -> String {
  guard let url = URL(string: string), url.scheme?.hasPrefix("http") == true,
        let container = FileManager.default.containerURL(
          forSecurityApplicationGroupIdentifier: "${APP_GROUP_ID}"
        )
  else {
    return string
  }

  // Use last path component as stable cache key (e.g. "0001.gif" from exercisedb)
  let lastComponent = url.lastPathComponent
  let filename = lastComponent.isEmpty ? UUID().uuidString + ".png" : "la_" + lastComponent
  let fileURL = container.appendingPathComponent(filename)

  // Return cached file if it already exists
  if FileManager.default.fileExists(atPath: fileURL.path) {
    return filename
  }

  let data = try await Data.download(from: url)
  try data.write(to: fileURL)
  return filename
}
`;
      fs.writeFileSync(helpersPath, cachedHelpers);
      console.log('[withWorkoutWidget] Replaced Helpers.swift with cached image version');
    }

    return config;
  });
}

// Add WorkoutWidgetBridge files to the Align target + create ShareExtension target
function withCustomXcodeFiles(config) {
  return withXcodeProject(config, (config) => {
    const proj = config.modResults;

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

    // Create the ShareExtension target (skip if already exists)
    const existingShareTarget = findNativeTarget(proj, SHARE_EXT_TARGET_NAME);
    if (!existingShareTarget) {
      createShareExtensionTarget(proj);
    } else {
      console.log('[withWorkoutWidget] ShareExtension target already exists, skipping creation');
    }

    return config;
  });
}

// Creates a new ShareExtension app_extension target in the Xcode project
function createShareExtensionTarget(proj) {
  const objects = proj.hash.project.objects;

  // 1. Create file reference for the Swift source file
  const swiftFileRefUuid = proj.generateUuid();
  objects['PBXFileReference'][swiftFileRefUuid] = {
    isa: 'PBXFileReference',
    lastKnownFileType: 'sourcecode.swift',
    path: 'ShareExtensionViewController.swift',
    sourceTree: '"<group>"',
  };
  objects['PBXFileReference'][`${swiftFileRefUuid}_comment`] = 'ShareExtensionViewController.swift';

  // Create file reference for Info.plist
  const infoPlistRefUuid = proj.generateUuid();
  objects['PBXFileReference'][infoPlistRefUuid] = {
    isa: 'PBXFileReference',
    lastKnownFileType: 'text.plist.xml',
    path: 'Info.plist',
    sourceTree: '"<group>"',
  };
  objects['PBXFileReference'][`${infoPlistRefUuid}_comment`] = 'Info.plist';

  // Create file reference for entitlements
  const entRefUuid = proj.generateUuid();
  objects['PBXFileReference'][entRefUuid] = {
    isa: 'PBXFileReference',
    lastKnownFileType: 'text.plist.entitlements',
    path: `${SHARE_EXT_TARGET_NAME}.entitlements`,
    sourceTree: '"<group>"',
  };
  objects['PBXFileReference'][`${entRefUuid}_comment`] = `${SHARE_EXT_TARGET_NAME}.entitlements`;

  // 2. Create a PBXGroup for the ShareExtension folder
  const groupUuid = proj.generateUuid();
  objects['PBXGroup'][groupUuid] = {
    isa: 'PBXGroup',
    children: [
      { value: swiftFileRefUuid, comment: 'ShareExtensionViewController.swift' },
      { value: infoPlistRefUuid, comment: 'Info.plist' },
      { value: entRefUuid, comment: `${SHARE_EXT_TARGET_NAME}.entitlements` },
    ],
    path: SHARE_EXT_TARGET_NAME,
    sourceTree: '"<group>"',
  };
  objects['PBXGroup'][`${groupUuid}_comment`] = SHARE_EXT_TARGET_NAME;

  // Add to the root project group
  const rootGroupKey = proj.getFirstProject().firstProject.mainGroup;
  const rootGroup = objects['PBXGroup'][rootGroupKey];
  if (rootGroup) {
    rootGroup.children.push({
      value: groupUuid,
      comment: SHARE_EXT_TARGET_NAME,
    });
  }

  // 3. Create build file for Swift source
  const buildFileUuid = proj.generateUuid();
  objects['PBXBuildFile'][buildFileUuid] = {
    isa: 'PBXBuildFile',
    fileRef: swiftFileRefUuid,
    fileRef_comment: 'ShareExtensionViewController.swift',
  };
  objects['PBXBuildFile'][`${buildFileUuid}_comment`] =
    'ShareExtensionViewController.swift in Sources';

  // 4. Create Sources build phase
  const sourcesBuildPhaseUuid = proj.generateUuid();
  objects['PBXSourcesBuildPhase'][sourcesBuildPhaseUuid] = {
    isa: 'PBXSourcesBuildPhase',
    buildActionMask: 2147483647,
    files: [{ value: buildFileUuid, comment: 'ShareExtensionViewController.swift in Sources' }],
    runOnlyForDeploymentPostprocessing: 0,
  };
  objects['PBXSourcesBuildPhase'][`${sourcesBuildPhaseUuid}_comment`] = 'Sources';

  // 5. Create Frameworks build phase (empty, UIKit is linked automatically)
  const frameworksBuildPhaseUuid = proj.generateUuid();
  if (!objects['PBXFrameworksBuildPhase']) objects['PBXFrameworksBuildPhase'] = {};
  objects['PBXFrameworksBuildPhase'][frameworksBuildPhaseUuid] = {
    isa: 'PBXFrameworksBuildPhase',
    buildActionMask: 2147483647,
    files: [],
    runOnlyForDeploymentPostprocessing: 0,
  };
  objects['PBXFrameworksBuildPhase'][`${frameworksBuildPhaseUuid}_comment`] = 'Frameworks';

  // 6. Create Resources build phase (empty)
  const resourcesBuildPhaseUuid = proj.generateUuid();
  if (!objects['PBXResourcesBuildPhase']) objects['PBXResourcesBuildPhase'] = {};
  objects['PBXResourcesBuildPhase'][resourcesBuildPhaseUuid] = {
    isa: 'PBXResourcesBuildPhase',
    buildActionMask: 2147483647,
    files: [],
    runOnlyForDeploymentPostprocessing: 0,
  };
  objects['PBXResourcesBuildPhase'][`${resourcesBuildPhaseUuid}_comment`] = 'Resources';

  // 7. Create product file reference (.appex)
  const productRefUuid = proj.generateUuid();
  objects['PBXFileReference'][productRefUuid] = {
    isa: 'PBXFileReference',
    explicitFileType: '"wrapper.app-extension"',
    includeInIndex: 0,
    path: `${SHARE_EXT_TARGET_NAME}.appex`,
    sourceTree: 'BUILT_PRODUCTS_DIR',
  };
  objects['PBXFileReference'][`${productRefUuid}_comment`] = `${SHARE_EXT_TARGET_NAME}.appex`;

  // Add product to Products group
  const productsGroup = proj.pbxGroupByName('Products');
  if (productsGroup) {
    productsGroup.children.push({
      value: productRefUuid,
      comment: `${SHARE_EXT_TARGET_NAME}.appex`,
    });
  }

  // 8. Create build configuration (Debug + Release)
  const debugConfigUuid = proj.generateUuid();
  const releaseConfigUuid = proj.generateUuid();
  const buildSettings = {
    CLANG_ENABLE_MODULES: 'YES',
    CODE_SIGN_ENTITLEMENTS: `${SHARE_EXT_TARGET_NAME}/${SHARE_EXT_TARGET_NAME}.entitlements`,
    CODE_SIGN_STYLE: 'Automatic',
    CURRENT_PROJECT_VERSION: 1,
    GENERATE_INFOPLIST_FILE: 'NO',
    INFOPLIST_FILE: `${SHARE_EXT_TARGET_NAME}/Info.plist`,
    IPHONEOS_DEPLOYMENT_TARGET: '16.2',
    MARKETING_VERSION: '1.0',
    PRODUCT_BUNDLE_IDENTIFIER: `"${SHARE_EXT_BUNDLE_ID}"`,
    PRODUCT_NAME: `"$(TARGET_NAME)"`,
    SWIFT_VERSION: '5.0',
    TARGETED_DEVICE_FAMILY: '"1"',
    SWIFT_EMIT_LOC_STRINGS: 'YES',
  };

  objects['XCBuildConfiguration'][debugConfigUuid] = {
    isa: 'XCBuildConfiguration',
    buildSettings: { ...buildSettings, DEBUG_INFORMATION_FORMAT: '"dwarf-with-dsym"' },
    name: 'Debug',
  };
  objects['XCBuildConfiguration'][`${debugConfigUuid}_comment`] = 'Debug';

  objects['XCBuildConfiguration'][releaseConfigUuid] = {
    isa: 'XCBuildConfiguration',
    buildSettings: { ...buildSettings, DEBUG_INFORMATION_FORMAT: '"dwarf-with-dsym"' },
    name: 'Release',
  };
  objects['XCBuildConfiguration'][`${releaseConfigUuid}_comment`] = 'Release';

  // 9. Create config list
  const configListUuid = proj.generateUuid();
  objects['XCConfigurationList'][configListUuid] = {
    isa: 'XCConfigurationList',
    buildConfigurations: [
      { value: debugConfigUuid, comment: 'Debug' },
      { value: releaseConfigUuid, comment: 'Release' },
    ],
    defaultConfigurationIsVisible: 0,
    defaultConfigurationName: 'Release',
  };
  objects['XCConfigurationList'][`${configListUuid}_comment`] =
    `Build configuration list for PBXNativeTarget "${SHARE_EXT_TARGET_NAME}"`;

  // 10. Create the PBXNativeTarget
  const targetUuid = proj.generateUuid();
  objects['PBXNativeTarget'][targetUuid] = {
    isa: 'PBXNativeTarget',
    buildConfigurationList: configListUuid,
    buildConfigurationList_comment: `Build configuration list for PBXNativeTarget "${SHARE_EXT_TARGET_NAME}"`,
    buildPhases: [
      { value: sourcesBuildPhaseUuid, comment: 'Sources' },
      { value: frameworksBuildPhaseUuid, comment: 'Frameworks' },
      { value: resourcesBuildPhaseUuid, comment: 'Resources' },
    ],
    buildRules: [],
    dependencies: [],
    name: SHARE_EXT_TARGET_NAME,
    productName: SHARE_EXT_TARGET_NAME,
    productReference: productRefUuid,
    productReference_comment: `${SHARE_EXT_TARGET_NAME}.appex`,
    productType: '"com.apple.product-type.app-extension"',
  };
  objects['PBXNativeTarget'][`${targetUuid}_comment`] = SHARE_EXT_TARGET_NAME;

  // 11. Add target to project's targets array
  const projectSection = proj.getFirstProject().firstProject;
  projectSection.targets.push({
    value: targetUuid,
    comment: SHARE_EXT_TARGET_NAME,
  });

  // 12. Add embed extension build phase to the main app target to embed the .appex
  const embedBuildFileUuid = proj.generateUuid();
  objects['PBXBuildFile'][embedBuildFileUuid] = {
    isa: 'PBXBuildFile',
    fileRef: productRefUuid,
    fileRef_comment: `${SHARE_EXT_TARGET_NAME}.appex`,
    settings: { ATTRIBUTES: ['RemoveHeadersOnCopy'] },
  };
  objects['PBXBuildFile'][`${embedBuildFileUuid}_comment`] =
    `${SHARE_EXT_TARGET_NAME}.appex in Embed Foundation Extensions`;

  // Create CopyFiles build phase (Embed Foundation Extensions)
  const copyPhaseUuid = proj.generateUuid();
  if (!objects['PBXCopyFilesBuildPhase']) objects['PBXCopyFilesBuildPhase'] = {};
  objects['PBXCopyFilesBuildPhase'][copyPhaseUuid] = {
    isa: 'PBXCopyFilesBuildPhase',
    buildActionMask: 2147483647,
    dstPath: '""',
    dstSubfolderSpec: 13, // 13 = PlugIns (where app extensions go)
    files: [
      {
        value: embedBuildFileUuid,
        comment: `${SHARE_EXT_TARGET_NAME}.appex in Embed Foundation Extensions`,
      },
    ],
    name: '"Embed Foundation Extensions"',
    runOnlyForDeploymentPostprocessing: 0,
  };
  objects['PBXCopyFilesBuildPhase'][`${copyPhaseUuid}_comment`] = 'Embed Foundation Extensions';

  // Add copy phase to main app target
  const alignTarget = findNativeTarget(proj, 'Align');
  if (alignTarget) {
    alignTarget.target.buildPhases.push({
      value: copyPhaseUuid,
      comment: 'Embed Foundation Extensions',
    });
  }

  // 13. Add target dependency from main app to ShareExtension
  const containerProxyUuid = proj.generateUuid();
  if (!objects['PBXContainerItemProxy']) objects['PBXContainerItemProxy'] = {};
  objects['PBXContainerItemProxy'][containerProxyUuid] = {
    isa: 'PBXContainerItemProxy',
    containerPortal: proj.getFirstProject().uuid,
    containerPortal_comment: 'Project object',
    proxyType: 1,
    remoteGlobalIDString: targetUuid,
    remoteInfo: SHARE_EXT_TARGET_NAME,
  };
  objects['PBXContainerItemProxy'][`${containerProxyUuid}_comment`] = 'PBXContainerItemProxy';

  const targetDepUuid = proj.generateUuid();
  if (!objects['PBXTargetDependency']) objects['PBXTargetDependency'] = {};
  objects['PBXTargetDependency'][targetDepUuid] = {
    isa: 'PBXTargetDependency',
    target: targetUuid,
    target_comment: SHARE_EXT_TARGET_NAME,
    targetProxy: containerProxyUuid,
    targetProxy_comment: 'PBXContainerItemProxy',
  };
  objects['PBXTargetDependency'][`${targetDepUuid}_comment`] = 'PBXTargetDependency';

  if (alignTarget) {
    alignTarget.target.dependencies.push({
      value: targetDepUuid,
      comment: 'PBXTargetDependency',
    });
  }

  console.log('[withWorkoutWidget] Created ShareExtension target');
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
