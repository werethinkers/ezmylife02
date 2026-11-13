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
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    /// Once the keyboard is connected, ask for Photos here (a keyboard can't show the question itself),
    /// so the keyboard can show recent photos to pick from. Asked once; iOS remembers the answer.
    func sceneDidBecomeActive(_ scene: UIScene) {
        guard EzyShared.isConnected, PHPhotoLibrary.authorizationStatus(for: .readWrite) == .notDetermined else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in }
        }
    }
}
