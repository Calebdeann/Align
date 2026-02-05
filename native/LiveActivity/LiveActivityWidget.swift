import ActivityKit
import Foundation
import SwiftUI
import WidgetKit

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
private let workoutDeepLink = URL(string: "align://active-workout")

struct LiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      LiveActivityView(contentState: context.state, attributes: context.attributes)
        .activityBackgroundTint(Color.black)
        .activitySystemActionForegroundColor(Color.white)
        .widgetURL(workoutDeepLink)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Text("Align")
            .font(.system(size: 14, weight: .semibold))
            .foregroundStyle(.white.opacity(0.7))
        }
        DynamicIslandExpandedRegion(.trailing) {
          if let date = context.state.timerEndDateInMilliseconds {
            Text(Date(timeIntervalSince1970: date / 1000), style: .timer)
              .font(.system(size: 14, weight: .semibold))
              .foregroundStyle(.white)
              .multilineTextAlignment(.trailing)
          }
        }
      } compactLeading: {
        Text("A")
          .font(.system(size: 16, weight: .bold))
          .foregroundStyle(alignPurple)
      } compactTrailing: {
        if let date = context.state.timerEndDateInMilliseconds {
          Text(Date(timeIntervalSince1970: date / 1000), style: .timer)
            .font(.system(size: 15))
            .minimumScaleFactor(0.8)
            .fontWeight(.semibold)
            .frame(maxWidth: 60)
            .multilineTextAlignment(.trailing)
        }
      } minimal: {
        Text("A")
          .font(.system(size: 14, weight: .bold))
          .foregroundStyle(alignPurple)
      }
    }
  }
}
