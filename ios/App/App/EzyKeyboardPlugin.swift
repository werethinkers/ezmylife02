import Foundation
import Capacitor
import UIKit

/// Lets the website (the /keyboard page, inside the app only) hand the keyboard its API key and shortcuts.
/// JavaScript side: src/lib/ezyKeyboard.ts. Registered in MainViewController. See docs/ios-keyboard.md.
@objc(EzyKeyboardPlugin)
public class EzyKeyboardPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "EzyKeyboardPlugin"
    public let jsName = "EzyKeyboard"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disconnect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise),
    ]

    /// Whether the keyboard is connected to the person's account. (iOS gives apps no way to see
    /// whether a keyboard is switched on in Settings, so the page just shows the steps.)
    @objc func status(_ call: CAPPluginCall) {
        call.resolve([
            "connected": EzyShared.isConnected,
            "shortcuts": EzyShared.shortcuts.count,
        ])
    }

    /// Saves the key made for this iPhone and fetches the person's shortcuts once.
    @objc func connect(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), key.hasPrefix("ezy_live_") else {
            call.reject("Missing key")
            return
        }
        EzyShared.apiKey = key
        Task {
            let count = (try? await EzyAPI.refreshShortcuts().count) ?? 0
            call.resolve(["connected": true, "shortcuts": count])
        }
    }

    @objc func disconnect(_ call: CAPPluginCall) {
        EzyShared.disconnect()
        call.resolve(["connected": false])
    }

    /// Opens this app's page in Settings, where Keyboards and "Allow Full Access" are switched on.
    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let url = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(url)
            }
            call.resolve()
        }
    }
}
