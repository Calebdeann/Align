import Foundation
import React

@objc(WorkoutWidgetBridge)
class WorkoutWidgetBridge: RCTEventEmitter {
  private static let appGroupId = "group.com.aligntracker.app"
  private static let workoutStateKey = "workoutState"
  private static let widgetActionsKey = "widgetActions"
  private static let darwinNotificationName = "com.aligntracker.app.setCompleted"

  private var hasListeners = false

  override init() {
    super.init()
    registerDarwinNotification()
  }

  override static func requiresMainQueueSetup() -> Bool { false }

  override func supportedEvents() -> [String] {
    return ["onWidgetSetCompleted"]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  // MARK: - Write workout state to App Groups

  @objc(writeWorkoutState:)
  func writeWorkoutState(_ jsonString: String) {
    guard let defaults = UserDefaults(suiteName: WorkoutWidgetBridge.appGroupId) else { return }
    guard let data = jsonString.data(using: .utf8) else { return }
    defaults.set(data, forKey: WorkoutWidgetBridge.workoutStateKey)
    defaults.synchronize()
  }

  // MARK: - Clear workout state

  @objc(clearWorkoutState)
  func clearWorkoutState() {
    guard let defaults = UserDefaults(suiteName: WorkoutWidgetBridge.appGroupId) else { return }
    defaults.removeObject(forKey: WorkoutWidgetBridge.workoutStateKey)
    defaults.removeObject(forKey: WorkoutWidgetBridge.widgetActionsKey)
    defaults.synchronize()
  }

  // MARK: - Read pending widget actions

  @objc(readWidgetActions:rejecter:)
  func readWidgetActions(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: WorkoutWidgetBridge.appGroupId) else {
      resolve([])
      return
    }

    let actions = defaults.array(forKey: WorkoutWidgetBridge.widgetActionsKey) ?? []
    defaults.removeObject(forKey: WorkoutWidgetBridge.widgetActionsKey)
    defaults.synchronize()
    resolve(actions)
  }

  // MARK: - Read pending video import (written by Share Extension)

  @objc(readPendingVideoImport:rejecter:)
  func readPendingVideoImport(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: WorkoutWidgetBridge.appGroupId) else {
      resolve(nil)
      return
    }

    // Try new JSON format first (pendingVideoImport)
    if let jsonString = defaults.string(forKey: "pendingVideoImport") {
      defaults.removeObject(forKey: "pendingVideoImport")
      defaults.synchronize()
      resolve(jsonString)
      return
    }

    // Fallback: read legacy key for in-flight shares from old extension version
    if let url = defaults.string(forKey: "pendingTikTokUrl") {
      defaults.removeObject(forKey: "pendingTikTokUrl")
      defaults.synchronize()
      // Return JSON format for consistency
      let payload: [String: String] = ["url": url, "platform": "tiktok"]
      if let jsonData = try? JSONSerialization.data(withJSONObject: payload),
         let result = String(data: jsonData, encoding: .utf8) {
        resolve(result)
      } else {
        resolve(nil)
      }
      return
    }

    resolve(nil)
  }

  // MARK: - Darwin notification (widget -> app)

  private func registerDarwinNotification() {
    let center = CFNotificationCenterGetDarwinNotifyCenter()
    let name = CFNotificationName(WorkoutWidgetBridge.darwinNotificationName as CFString)

    CFNotificationCenterAddObserver(
      center,
      Unmanaged.passUnretained(self).toOpaque(),
      { _, observer, _, _, _ in
        guard let observer = observer else { return }
        let bridge = Unmanaged<WorkoutWidgetBridge>.fromOpaque(observer).takeUnretainedValue()
        DispatchQueue.main.async {
          bridge.handleWidgetAction()
        }
      },
      name.rawValue,
      nil,
      .deliverImmediately
    )
  }

  private func handleWidgetAction() {
    guard hasListeners else { return }
    // Short delay to allow UserDefaults to sync across processes
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
      guard let self = self, self.hasListeners else { return }
      guard let defaults = UserDefaults(suiteName: WorkoutWidgetBridge.appGroupId) else { return }
      defaults.synchronize()
      let actions = defaults.array(forKey: WorkoutWidgetBridge.widgetActionsKey) as? [[String: Any]] ?? []
      guard !actions.isEmpty else { return }
      defaults.removeObject(forKey: WorkoutWidgetBridge.widgetActionsKey)
      defaults.synchronize()
      self.sendEvent(withName: "onWidgetSetCompleted", body: ["actions": actions])
    }
  }
}
