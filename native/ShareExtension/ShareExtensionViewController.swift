import UIKit
import UniformTypeIdentifiers

class ShareExtensionViewController: UIViewController {
  private static let appGroupId = "group.com.aligntracker.app"
  private static let sharedUrlKey = "pendingVideoImport"

  override func viewDidLoad() {
    super.viewDidLoad()
    showLoadingUI()
    handleIncomingContent()
  }

  private func showLoadingUI() {
    // Brand purple background
    view.backgroundColor = UIColor(red: 148/255, green: 122/255, blue: 255/255, alpha: 1.0)

    let stack = UIStackView()
    stack.axis = .vertical
    stack.alignment = .center
    stack.spacing = 8
    stack.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(stack)

    let icon = UIImageView()
    icon.image = UIImage(systemName: "arrow.up.circle.fill")
    icon.tintColor = .white
    icon.translatesAutoresizingMaskIntoConstraints = false
    icon.widthAnchor.constraint(equalToConstant: 48).isActive = true
    icon.heightAnchor.constraint(equalToConstant: 48).isActive = true

    let label = UILabel()
    label.text = "Sending to Align..."
    label.textColor = .white
    label.font = UIFont.systemFont(ofSize: 18, weight: .semibold)
    label.textAlignment = .center

    stack.addArrangedSubview(icon)
    stack.addArrangedSubview(label)

    NSLayoutConstraint.activate([
      stack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
      stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
    ])
  }

  private func handleIncomingContent() {
    guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
      closeOnce()
      return
    }

    for item in extensionItems {
      guard let attachments = item.attachments else { continue }
      for provider in attachments {
        // TikTok shares URLs as public.url
        if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
          provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] data, _ in
            guard let url = data as? URL else {
              self?.closeOnce()
              return
            }
            self?.processUrl(url)
          }
          return
        }
        // Sometimes shared as plain text containing a URL
        if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
          provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] data, _ in
            guard let text = data as? String,
                  (text.contains("tiktok.com") || text.contains("instagram.com")),
                  let url = URL(string: text.trimmingCharacters(in: .whitespacesAndNewlines)) else {
              self?.closeOnce()
              return
            }
            self?.processUrl(url)
          }
          return
        }
      }
    }
    closeOnce()
  }

  private var didClose = false

  private func detectPlatform(_ urlString: String) -> String {
    if urlString.contains("instagram.com") {
      return "instagram"
    }
    return "tiktok"
  }

  private func processUrl(_ url: URL) {
    let urlString = url.absoluteString

    // Validate it is a supported URL
    guard urlString.contains("tiktok.com") || urlString.contains("instagram.com") else {
      DispatchQueue.main.async {
        self.showError("Only TikTok and Instagram videos are supported.")
      }
      return
    }

    let platform = detectPlatform(urlString)

    // Write JSON with url + platform to App Groups UserDefaults
    if let defaults = UserDefaults(suiteName: ShareExtensionViewController.appGroupId) {
      let payload: [String: String] = ["url": urlString, "platform": platform]
      if let jsonData = try? JSONSerialization.data(withJSONObject: payload),
         let jsonString = String(data: jsonData, encoding: .utf8) {
        defaults.set(jsonString, forKey: ShareExtensionViewController.sharedUrlKey)
        defaults.synchronize()
      }
    }

    // Open the containing app via extensionContext.open()
    DispatchQueue.main.async {
      let deepLink = URL(string: "align://import-video")!

      self.extensionContext?.open(deepLink) { [weak self] success in
        DispatchQueue.main.async {
          self?.closeOnce()
        }
      }

      // Safety timeout: close after 3s if completion handler never fires
      DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
        self?.closeOnce()
      }
    }
  }

  private func closeOnce() {
    guard !didClose else { return }
    didClose = true
    extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
  }

  private func showError(_ message: String) {
    // Remove loading UI
    view.subviews.forEach { $0.removeFromSuperview() }
    view.backgroundColor = UIColor(red: 148/255, green: 122/255, blue: 255/255, alpha: 1.0)

    let label = UILabel()
    label.text = message
    label.textColor = .white
    label.font = UIFont.systemFont(ofSize: 16, weight: .medium)
    label.textAlignment = .center
    label.numberOfLines = 0
    label.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(label)

    NSLayoutConstraint.activate([
      label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
      label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
      label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
      label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
    ])

    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
      self.closeOnce()
    }
  }

}
