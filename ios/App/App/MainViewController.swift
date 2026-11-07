import UIKit
import Capacitor

/// The app's one screen: Capacitor's web view showing https://ezyourlife.com (capacitor.config.ts).
/// Adds the iPhone "swipe from the left edge to go back" gesture, which a plain web view lacks.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        webView?.allowsBackForwardNavigationGestures = true
    }
}
