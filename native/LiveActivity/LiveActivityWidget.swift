import ActivityKit
import AppIntents
import Foundation
import SwiftUI
import WidgetKit

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

// MARK: - Live Activity Attributes & Widget

struct LiveActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var title: String
    var subtitle: String?
    var timerEndDateInMilliseconds: Double?
    var progress: Double?
    var imageName: String?
    var dynamicIslandImageName: String?
  }

  var name: String
  var backgroundColor: String?
  var titleColor: String?
  var subtitleColor: String?
  var progressViewTint: String?
  var progressViewLabelColor: String?
  var deepLinkUrl: String?
  var timerType: DynamicIslandTimerType?
  var padding: Int?
  var paddingDetails: PaddingDetails?
  var imagePosition: String?
  var imageWidth: Int?
  var imageHeight: Int?
  var imageWidthPercent: Double?
  var imageHeightPercent: Double?
  var imageAlign: String?
  var contentFit: String?

  enum DynamicIslandTimerType: String, Codable {
    case circular
    case digital
  }

  struct PaddingDetails: Codable, Hashable {
    var top: Int?
    var bottom: Int?
    var left: Int?
    var right: Int?
    var vertical: Int?
    var horizontal: Int?
  }
}

private let alignPurple = Color(hex: "#947AFF")

struct LiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      LiveActivityView(contentState: context.state, attributes: context.attributes)
        .activityBackgroundTint(Color(UIColor.systemBackground))
        .activitySystemActionForegroundColor(Color.black)
        .applyWidgetURL(from: context.attributes.deepLinkUrl)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading, priority: 1) {
          dynamicIslandExpandedLeading
            .dynamicIsland(verticalPlacement: .belowIfTooWide)
            .padding(.leading, 5)
            .applyWidgetURL(from: context.attributes.deepLinkUrl)
        }
        DynamicIslandExpandedRegion(.trailing) {
          dynamicIslandExpandedTrailing(context: context)
            .padding(.trailing, 5)
            .applyWidgetURL(from: context.attributes.deepLinkUrl)
        }
        DynamicIslandExpandedRegion(.bottom) {
          dynamicIslandExpandedBottom(context: context)
            .padding(.horizontal, 5)
            .applyWidgetURL(from: context.attributes.deepLinkUrl)
        }
      } compactLeading: {
        Text("A")
          .font(.system(size: 16, weight: .bold))
          .foregroundStyle(alignPurple)
          .applyWidgetURL(from: context.attributes.deepLinkUrl)
      } compactTrailing: {
        if let date = context.state.timerEndDateInMilliseconds {
          Text(Date(timeIntervalSince1970: date / 1000), style: .timer)
            .font(.system(size: 15))
            .minimumScaleFactor(0.8)
            .fontWeight(.semibold)
            .frame(maxWidth: 60)
            .multilineTextAlignment(.trailing)
            .applyWidgetURL(from: context.attributes.deepLinkUrl)
        }
      } minimal: {
        Text("A")
          .font(.system(size: 14, weight: .bold))
          .foregroundStyle(alignPurple)
          .applyWidgetURL(from: context.attributes.deepLinkUrl)
      }
    }
  }

  // MARK: - Dynamic Island Expanded Regions

  private var dynamicIslandExpandedLeading: some View {
    VStack(alignment: .leading, spacing: 2) {
      let state = WorkoutWidgetDataStore.readState()

      if let state = state, !state.allSetsComplete,
         state.currentExerciseIndex >= 0,
         state.currentExerciseIndex < state.exercises.count
      {
        let exercise = state.exercises[state.currentExerciseIndex]
        let sIdx = state.currentSetIndex
        let currentSet: WidgetExerciseSet? = (sIdx >= 0 && sIdx < exercise.sets.count)
          ? exercise.sets[sIdx] : nil

        Spacer()
        Text(exercise.name)
          .font(.system(size: 16, weight: .semibold))
          .foregroundStyle(.white)
          .lineLimit(1)

        if let set = currentSet {
          Text("Set \(set.setNumber) of \(set.totalSets)")
            .font(.system(size: 13))
            .foregroundStyle(.white.opacity(0.7))
        }
        Spacer()
      } else {
        Spacer()
        Text(state?.workoutName ?? "Workout")
          .font(.title2)
          .foregroundStyle(.white)
          .fontWeight(.semibold)
        Spacer()
      }
    }
  }

  private func dynamicIslandExpandedTrailing(context: ActivityViewContext<LiveActivityAttributes>) -> some View {
    VStack {
      Spacer()
      if let imageName = context.state.imageName {
        Image.dynamic(assetNameOrPath: imageName)
          .resizable()
          .scaledToFill()
          .frame(width: 36, height: 36)
          .cornerRadius(6)
          .clipped()
      }
      Spacer()
    }
  }

  private func dynamicIslandExpandedBottom(context: ActivityViewContext<LiveActivityAttributes>) -> some View {
    HStack {
      if let date = context.state.timerEndDateInMilliseconds {
        Text(Date(timeIntervalSince1970: date / 1000), style: .timer)
          .font(.system(size: 18, weight: .semibold, design: .monospaced))
          .foregroundStyle(alignPurple)
      }
      Spacer()

      let state = WorkoutWidgetDataStore.readState()
      if let state = state, !state.allSetsComplete,
         state.currentExerciseIndex >= 0,
         state.currentExerciseIndex < state.exercises.count
      {
        let exercise = state.exercises[state.currentExerciseIndex]
        let sIdx = state.currentSetIndex
        let set: WidgetExerciseSet? = (sIdx >= 0 && sIdx < exercise.sets.count)
          ? exercise.sets[sIdx] : nil

        if let set = set {
          HStack(spacing: 4) {
            if !set.weight.isEmpty {
              Text(set.weight)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
            }
            Text("x")
              .font(.system(size: 13))
              .foregroundStyle(.white.opacity(0.6))
            if !set.reps.isEmpty {
              Text(set.reps)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
            }
          }
        }
      }
    }
    .padding(.top, 5)
  }
}
