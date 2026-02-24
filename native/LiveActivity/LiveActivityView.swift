import SwiftUI
import WidgetKit

#if canImport(ActivityKit)
  import ActivityKit
#endif

// MARK: - Live Activity Lock Screen View

#if canImport(ActivityKit)

  struct LiveActivityView: View {
    let contentState: LiveActivityAttributes.ContentState
    let attributes: LiveActivityAttributes

    private var setInfo: String? {
      guard let subtitle = contentState.subtitle, !subtitle.isEmpty else { return nil }
      let parts = subtitle.components(separatedBy: " \u{00B7} ")
      return parts.first
    }

    private var weightRepsInfo: String? {
      guard let subtitle = contentState.subtitle, !subtitle.isEmpty else { return nil }
      let parts = subtitle.components(separatedBy: " \u{00B7} ")
      return parts.count > 1 ? parts[1] : nil
    }

    private let addExerciseUrl = URL(string: "align://active-workout?addExercise=1")!

    var body: some View {
      VStack(alignment: .leading, spacing: 8) {
        // Top row: Align + timer
        HStack {
          Text("Align")
            .font(.system(size: 14, weight: .semibold))
            .foregroundStyle(Color.white.opacity(0.7))

          Spacer()

          if let date = contentState.timerEndDateInMilliseconds {
            Text(Date(timeIntervalSince1970: date / 1000), style: .timer)
              .font(.system(size: 14, weight: .semibold))
              .foregroundStyle(Color.white)
              .multilineTextAlignment(.trailing)
          }
        }

        // Exercise info or empty state
        if contentState.title.isEmpty {
          Link(destination: addExerciseUrl) {
            HStack {
              Spacer()
              Text("Add an exercise")
                .font(.system(size: 20, weight: .medium))
                .foregroundStyle(Color.white)
              Spacer()
            }
          }
        } else {
          HStack(alignment: .top, spacing: 12) {
            // Circular exercise thumbnail
            if let imageName = contentState.imageName, !imageName.isEmpty {
              Image.dynamic(assetNameOrPath: imageName)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 40, height: 40)
                .clipShape(Circle())
            }

            // Exercise name + set info + weight/reps
            VStack(alignment: .leading, spacing: 2) {
              Text(contentState.title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Color.white)
                .lineLimit(1)

              if let setInfo = setInfo {
                Text(setInfo)
                  .font(.system(size: 13, weight: .regular))
                  .foregroundStyle(Color.white.opacity(0.7))
                  .lineLimit(1)
              }

              if let weightReps = weightRepsInfo {
                Text(weightReps)
                  .font(.system(size: 20, weight: .semibold))
                  .foregroundStyle(Color.white)
                  .lineLimit(1)
                  .padding(.top, 12)
              }
            }

            Spacer()

            // Add exercise button
            Link(destination: addExerciseUrl) {
              Image(systemName: "plus")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color.white)
                .frame(width: 32, height: 32)
                .background(Color(hex: "#947AFF"))
                .clipShape(Circle())
            }
          }
        }
      }
      .padding(EdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16))
    }
  }

#endif
