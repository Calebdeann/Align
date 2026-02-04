import SwiftUI
import WidgetKit

#if canImport(ActivityKit)

  // Purple brand color
  private let alignPurple = Color(hex: "#947AFF")

  struct LiveActivityView: View {
    let contentState: LiveActivityAttributes.ContentState
    let attributes: LiveActivityAttributes

    // Read full workout state from App Groups
    private var workoutState: WidgetWorkoutState? {
      WorkoutWidgetDataStore.readState()
    }

    var body: some View {
      if let state = workoutState {
        richWorkoutView(state: state)
          .padding(EdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16))
      } else {
        fallbackView
          .padding(EdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16))
      }
    }

    // MARK: - Rich workout view (with full state from App Groups)

    @ViewBuilder
    private func richWorkoutView(state: WidgetWorkoutState) -> some View {
      VStack(alignment: .leading, spacing: 12) {
        // Row 1: Branding + Timer
        headerRow(state: state)

        if state.allSetsComplete {
          allCompleteView
        } else {
          // Row 2: Current exercise info
          exerciseInfoRow(state: state)

          // Row 3: Weight/reps + check button
          weightRepsRow(state: state)
        }
      }
    }

    // MARK: - Header: "Align" branding + timer

    private func headerRow(state: WidgetWorkoutState) -> some View {
      HStack {
        Text("Align")
          .font(.system(size: 14, weight: .semibold))
          .foregroundStyle(.secondary)

        Spacer()

        // Elapsed timer (counts up from startedAt)
        Text(Date(timeIntervalSince1970: state.startedAtMs / 1000), style: .timer)
          .font(.system(size: 16, weight: .semibold, design: .monospaced))
          .foregroundStyle(alignPurple)
      }
    }

    // MARK: - Exercise info row

    @ViewBuilder
    private func exerciseInfoRow(state: WidgetWorkoutState) -> some View {
      let eIdx = state.currentExerciseIndex
      if eIdx >= 0, eIdx < state.exercises.count {
        let exercise = state.exercises[eIdx]
        let sIdx = state.currentSetIndex
        let currentSet: WidgetExerciseSet? = (sIdx >= 0 && sIdx < exercise.sets.count)
          ? exercise.sets[sIdx] : nil

        HStack(spacing: 10) {
          // Exercise thumbnail
          if let imageName = contentState.imageName {
            Image.dynamic(assetNameOrPath: imageName)
              .resizable()
              .scaledToFill()
              .frame(width: 40, height: 40)
              .cornerRadius(8)
              .clipped()
          } else {
            RoundedRectangle(cornerRadius: 8)
              .fill(Color.gray.opacity(0.2))
              .frame(width: 40, height: 40)
          }

          VStack(alignment: .leading, spacing: 2) {
            Text(exercise.name)
              .font(.system(size: 15, weight: .semibold))
              .foregroundStyle(.primary)
              .lineLimit(1)

            if let set = currentSet {
              Text("Set \(set.setNumber) of \(set.totalSets)")
                .font(.system(size: 13))
                .foregroundStyle(.secondary)
            }
          }

          Spacer()
        }
      }
    }

    // MARK: - Weight / reps + check button

    @ViewBuilder
    private func weightRepsRow(state: WidgetWorkoutState) -> some View {
      let eIdx = state.currentExerciseIndex
      if eIdx >= 0, eIdx < state.exercises.count {
        let exercise = state.exercises[eIdx]
        let sIdx = state.currentSetIndex
        let currentSet: WidgetExerciseSet? = (sIdx >= 0 && sIdx < exercise.sets.count)
          ? exercise.sets[sIdx] : nil

        HStack {
          if let set = currentSet {
            HStack(spacing: 6) {
              if !set.weight.isEmpty {
                Text(set.weight)
                  .font(.system(size: 24, weight: .bold))
                  .foregroundStyle(.primary)
                Text(state.weightUnit)
                  .font(.system(size: 14, weight: .medium))
                  .foregroundStyle(.secondary)
              } else {
                Text("-")
                  .font(.system(size: 24, weight: .bold))
                  .foregroundStyle(.tertiary)
                Text(state.weightUnit)
                  .font(.system(size: 14, weight: .medium))
                  .foregroundStyle(.secondary)
              }

              Text("x")
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(.secondary)
                .padding(.horizontal, 2)

              if !set.reps.isEmpty {
                Text(set.reps)
                  .font(.system(size: 24, weight: .bold))
                  .foregroundStyle(.primary)
                Text("reps")
                  .font(.system(size: 14, weight: .medium))
                  .foregroundStyle(.secondary)
              } else {
                Text("-")
                  .font(.system(size: 24, weight: .bold))
                  .foregroundStyle(.tertiary)
                Text("reps")
                  .font(.system(size: 14, weight: .medium))
                  .foregroundStyle(.secondary)
              }
            }
          }

          Spacer()

          // Check button
          checkButton
        }
      }
    }

    // MARK: - Check button (interactive on iOS 17+, deep link on iOS 16)

    @ViewBuilder
    private var checkButton: some View {
      let checkmarkView = Image(systemName: "checkmark")
        .font(.system(size: 20, weight: .bold))
        .foregroundColor(.white)
        .frame(width: 48, height: 48)
        .background(alignPurple)
        .cornerRadius(24)

      if #available(iOS 17.0, *) {
        Button(intent: CompleteSetIntent()) {
          checkmarkView
        }
        .buttonStyle(.plain)
      } else {
        Link(destination: URL(string: "align://active-workout")!) {
          checkmarkView
        }
      }
    }

    // MARK: - All sets complete view

    private var allCompleteView: some View {
      VStack(spacing: 10) {
        Text("All sets complete!")
          .font(.system(size: 16, weight: .semibold))
          .foregroundStyle(.primary)

        Link(destination: URL(string: "align://add-exercise")!) {
          HStack(spacing: 6) {
            Image(systemName: "plus")
              .font(.system(size: 14, weight: .semibold))
            Text("Add an Exercise")
              .font(.system(size: 14, weight: .semibold))
          }
          .foregroundColor(.white)
          .padding(.horizontal, 20)
          .padding(.vertical, 10)
          .background(alignPurple)
          .cornerRadius(20)
        }
      }
      .frame(maxWidth: .infinity)
      .padding(.vertical, 4)
    }

    // MARK: - Fallback view (no App Groups data available)

    private var fallbackView: some View {
      VStack(alignment: .leading, spacing: 4) {
        HStack {
          Text("Align")
            .font(.system(size: 14, weight: .semibold))
            .foregroundStyle(.secondary)
          Spacer()
          if let date = contentState.timerEndDateInMilliseconds {
            Text(Date(timeIntervalSince1970: date / 1000), style: .timer)
              .font(.system(size: 16, weight: .semibold, design: .monospaced))
              .foregroundStyle(alignPurple)
          }
        }

        Text(contentState.title)
          .font(.system(size: 18, weight: .semibold))
          .foregroundStyle(.primary)

        if let subtitle = contentState.subtitle {
          Text(subtitle)
            .font(.system(size: 14))
            .foregroundStyle(.secondary)
        }
      }
    }
  }

#endif
