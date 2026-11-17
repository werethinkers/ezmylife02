import UIKit
import Capacitor
import Photos

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = MainViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
        for context in connectionOptions.urlContexts { EzyShareSheet.handle(context.url, in: window) }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts { EzyShareSheet.handle(context.url, in: window) }
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    /// Once the keyboard is connected, ask for Photos here (a keyboard can't show the question itself),
    /// so the keyboard can show recent photos to pick from. Asked once; iOS remembers the answer.
    func sceneDidBecomeActive(_ scene: UIScene) {
        EzyClipboard.mirrorToFiles()
        guard EzyShared.isConnected, PHPhotoLibrary.authorizationStatus(for: .readWrite) == .notDetermined else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in }
        }
    }
}

/// ezyourlife://share-pdf?file=<name>: opens the iPhone share sheet on a saved PDF, so the person picks
/// WhatsApp (or Mail, Messages, AirDrop...) and the PDF lands in that chat as an attachment.
enum EzyShareSheet {
    static func handle(_ url: URL, in window: UIWindow?) {
        guard url.scheme == "ezyourlife", url.host == "share-pdf",
              let name = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "file" })?.value,
              !name.contains("/"),
              let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else { return }
        EzyClipboard.mirrorToFiles()
        let file = docs.appendingPathComponent(name)
        guard FileManager.default.fileExists(atPath: file.path) else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            var top = window?.rootViewController
            while let next = top?.presentedViewController { top = next }
            let sheet = UIActivityViewController(activityItems: [file], applicationActivities: nil)
            top?.present(sheet, animated: true)
        }
    }
}
