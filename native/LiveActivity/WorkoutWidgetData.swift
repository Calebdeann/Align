import Foundation

// MARK: - Shared data model (matches JS WidgetWorkoutState)

struct WidgetWorkoutState: Codable {
  let workoutName: String
  let startedAtMs: Double
  let exercises: [WidgetExercise]
  var currentExerciseIndex: Int
  var currentSetIndex: Int
  var totalCompletedSets: Int
  let totalSets: Int
  var allSetsComplete: Bool
  let weightUnit: String
}

struct WidgetExercise: Codable {
  let name: String
  let thumbnailUrl: String?
  var sets: [WidgetExerciseSet]
}

struct WidgetExerciseSet: Codable {
  let setNumber: Int
  let totalSets: Int
  let weight: String
  let reps: String
  var completed: Bool
  let setType: String?
}

// MARK: - UserDefaults helpers

enum WorkoutWidgetDataStore {
  private static let suiteName = "group.com.aligntracker.app"
  private static let workoutStateKey = "workoutState"
  private static let widgetActionsKey = "widgetActions"

  static func readState() -> WidgetWorkoutState? {
    guard let defaults = UserDefaults(suiteName: suiteName),
      let data = defaults.data(forKey: workoutStateKey)
    else { return nil }
    return try? JSONDecoder().decode(WidgetWorkoutState.self, from: data)
  }

  static func writeState(_ state: WidgetWorkoutState) {
    guard let defaults = UserDefaults(suiteName: suiteName),
      let data = try? JSONEncoder().encode(state)
    else { return }
    defaults.set(data, forKey: workoutStateKey)
    defaults.synchronize()
  }

  static func writeAction(_ action: [String: Any]) {
    guard let defaults = UserDefaults(suiteName: suiteName) else { return }
    var actions = defaults.array(forKey: widgetActionsKey) as? [[String: Any]] ?? []
    actions.append(action)
    defaults.set(actions, forKey: widgetActionsKey)
    defaults.synchronize()
  }

  /// Find the next uncompleted set, returns (exerciseIndex, setIndex) or nil
  static func findNextUncompletedSet(in state: WidgetWorkoutState) -> (Int, Int)? {
    for eIdx in 0..<state.exercises.count {
      for sIdx in 0..<state.exercises[eIdx].sets.count {
        if !state.exercises[eIdx].sets[sIdx].completed {
          return (eIdx, sIdx)
        }
      }
    }
    return nil
  }
}
