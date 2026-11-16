import UIKit
import Capacitor

/// The app's one screen: Capacitor's web view showing https://ezyourlife.com (capacitor.config.ts).
/// Adds the iPhone "swipe from the left edge to go back" gesture, which a plain web view lacks,
/// the EzyKeyboard plugin that connects the EZYOURLIFE keyboard (docs/ios-keyboard.md), and opens the page
/// Siri hands over with an ezyourlife://open?path=... link (photo and PDF apps, AskEzyourlifeIntent.swift).
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        webView?.allowsBackForwardNavigationGestures = true
        bridge?.registerPluginInstance(EzyKeyboardPlugin())
        if let page = Self.pendingPage {
            Self.pendingPage = nil
            // Let the home page start loading first, then go to the page Siri asked for.
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in self?.show(page) }
        }
    }

    /// A page to open once the web view exists (the app was started from a Siri link).
    static var pendingPage: URL?

    /// ezyourlife://open?path=/tool/blur-image -> https://ezyourlife.com/tool/blur-image. Only paths on the site.
    static func page(for url: URL) -> URL? {
        guard url.scheme == "ezyourlife", url.host == "open",
              let path = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "path" })?.value,
              path.hasPrefix("/"), !path.hasPrefix("//") else { return nil }
        return URL(string: EzyShared.site + path)
    }

    func show(_ page: URL) {
        guard let webView else { Self.pendingPage = page; return }
        webView.load(URLRequest(url: page))
    }
}
