import SwiftUI
import UIKit

private let appGroups = [
  "group.com.aligntracker.app",
]

extension Image {
  static func dynamic(assetNameOrPath: String) -> Self {
    for group in appGroups {
      if let container = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: group
      ) {
        let filePath = container.appendingPathComponent(assetNameOrPath).path
        if let uiImage = UIImage(contentsOfFile: filePath) {
          return Image(uiImage: uiImage)
        }
      }
    }
    return Image(assetNameOrPath)
  }
}

extension UIImage {
  static func dynamic(assetNameOrPath: String) -> UIImage? {
    for group in appGroups {
      if let container = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: group
      ) {
        let filePath = container.appendingPathComponent(assetNameOrPath).path
        if let uiImage = UIImage(contentsOfFile: filePath) {
          return uiImage
        }
      }
    }
    return UIImage(named: assetNameOrPath)
  }
}
