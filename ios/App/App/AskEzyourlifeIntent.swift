import AppIntents
import UIKit

/*
 * "Hey Siri, ask EZYOURLIFE" / the Action Button / Back Tap / the Shortcuts app.
 * Siri asks "What do you need?", the person speaks ("proforma invoice for Rahul Traders, 5,000 rupees"),
 * and this runs without opening the app, so they stay in WhatsApp or Instagram:
 *   1. a saved shortcut with that name is copied straight away (free);
 *   2. otherwise POST /v1/command picks the app and fills its boxes (free), Siri asks
 *      "Run Proforma Invoice for 2 credits?", and only then the app runs at its normal price.
 * The result is copied and waits as the first suggestion in the EZYOURLIFE keyboard.
 * Keyboards can never use the microphone (Apple's rule), so voice lives here. See docs/ios-keyboard.md.
 */
@available(iOS 16.0, *)
struct AskEzyourlifeIntent: AppIntent {
    static var title: LocalizedStringResource = "Ask EZYOURLIFE"
    static var description = IntentDescription("Say what you need. EZYOURLIFE runs the right app and copies the result, ready to paste or tap in from the EZYOURLIFE keyboard.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Request", requestValueDialog: "What do you need?")
    var request: String

    func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
        guard EzyShared.isConnected else {
            return .result(value: "", dialog: "Open the EZYOURLIFE app, go to Keyboard and voice, and tap Connect first.")
        }
        let spoken = request.trimmingCharacters(in: .whitespacesAndNewlines)

        // 1. A saved shortcut: "pm", "shortcut pm", "my address".
        let name = spoken.lowercased()
            .replacingOccurrences(of: "shortcut ", with: "")
            .trimmingCharacters(in: CharacterSet(charactersIn: " ./\\"))
        if EzyShared.shortcutsAge > 600 { _ = try? await EzyAPI.refreshShortcuts() }
        if let hit = EzyShared.shortcuts.first(where: { $0.key.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: "/\\")) == name }) {
            let result = EzyResult(title: hit.key, text: hit.value, imageURL: nil, at: Date())
            EzyShared.lastResult = result
            await EzyClipboard.copy(result)
            return .result(value: hit.value, dialog: "Copied your \(hit.key) shortcut.")
        }

        // 2. An app.
        let plan: EzyPlan
        do {
            plan = try await EzyAPI.plan(spoken)
        } catch {
            return .result(value: "", dialog: IntentDialog(stringLiteral: error.localizedDescription))
        }
        guard let app = plan.app else {
            return .result(value: "", dialog: IntentDialog(stringLiteral: plan.message ?? "I couldn't find an app for that. Try other words."))
        }
        if let missing = plan.missing, !missing.isEmpty {
            let list = missing.map(\.label).joined(separator: ", ")
            return .result(value: "", dialog: IntentDialog(stringLiteral: "\(app.name) also needs: \(list). Say it again with those."))
        }
        let price = app.priceLabel.isEmpty ? "" : " for \(app.priceLabel)"
        try await requestConfirmation(
            result: .result(dialog: IntentDialog(stringLiteral: "Run \(app.name)\(price)?")),
            confirmationActionName: .go
        )
        do {
            let result = try await EzyAPI.run(plan)
            EzyShared.lastResult = result
            await EzyClipboard.copy(result)
            let what = result.imageURL != nil ? "The image is copied" : "The result is copied"
            return .result(value: result.text, dialog: IntentDialog(stringLiteral: "\(what). Tap it in the EZYOURLIFE keyboard or paste it."))
        } catch {
            return .result(value: "", dialog: IntentDialog(stringLiteral: error.localizedDescription))
        }
    }
}

@available(iOS 16.0, *)
struct EzyAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AskEzyourlifeIntent(),
            phrases: [
                "Ask \(.applicationName)",
                "\(.applicationName) command",
                "Tell \(.applicationName)",
            ],
            shortTitle: "Ask EZYOURLIFE",
            systemImageName: "mic.fill"
        )
    }
}
