import AppIntents
import Foundation

#if canImport(ActivityKit)
  import ActivityKit
#endif

@available(iOS 17.0, *)
struct CompleteSetIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Complete Set"
  static var description: IntentDescription = "Marks the current set as completed"

  func perform() async throws -> some IntentResult {
    guard var state = WorkoutWidgetDataStore.readState() else {
      return .result()
    }

    let eIdx = state.currentExerciseIndex
    let sIdx = state.currentSetIndex

    guard eIdx >= 0, eIdx < state.exercises.count,
      sIdx >= 0, sIdx < state.exercises[eIdx].sets.count,
      !state.exercises[eIdx].sets[sIdx].completed
    else {
      return .result()
    }

    // Mark the current set as completed
    state.exercises[eIdx].sets[sIdx].completed = true
    state.totalCompletedSets += 1

    // Find next uncompleted set
    if let (nextE, nextS) = WorkoutWidgetDataStore.findNextUncompletedSet(in: state) {
      state.currentExerciseIndex = nextE
      state.currentSetIndex = nextS
      state.allSetsComplete = false
    } else {
      state.allSetsComplete = true
    }

    // Write updated state back
    WorkoutWidgetDataStore.writeState(state)

    // Record the action for the app to pick up
    WorkoutWidgetDataStore.writeAction([
      "type": "completeSet",
      "exerciseIndex": eIdx,
      "setIndex": sIdx,
      "timestamp": Date().timeIntervalSince1970 * 1000,
    ])

    // Post Darwin notification to wake the app
    let center = CFNotificationCenterGetDarwinNotifyCenter()
    let name = CFNotificationName("com.aligntracker.app.setCompleted" as CFString)
    CFNotificationCenterPostNotification(center, name, nil, nil, true)

    return .result()
  }
}
