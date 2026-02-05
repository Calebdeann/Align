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

    var body: some View {
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
      .padding(EdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16))
    }
  }

#endif
