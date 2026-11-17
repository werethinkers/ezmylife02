import AppIntents
import UIKit
import Contacts

/*
 * "Hey Siri, ask EZYOURLIFE" / the Action Button / Back Tap / the Shortcuts app (iOS 18 and later).
 * One spoken conversation, start to finish, with the person staying in their chat:
 *   1. "What do you need?"  A saved shortcut with that name is copied at once (free).
 *   2. Otherwise POST /v1/command picks the app (free). If the person describes a problem
 *      ("mujhe invoice mai dikkat aa rahi hai") Siri asks what is wrong, and "making one" carries on.
 *   3. Siri asks for each box still empty, one at a time, in the person's own words.
 *   4. Siri reads the answers back with the price: Run, Change something, or Cancel. Nothing is charged before Run.
 *   5. After the run: text or PDF (when the app offers it), who to send it to (a name from Contacts or a spoken
 *      number), and by WhatsApp, Messages, Mail or just copy. iOS doesn't let any app send a message silently, so
 *      the chat opens with the text and the person taps Send once; a PDF is copied and pasted in that chat.
 * The result is also copied and waits as the first suggestion in the EZYOURLIFE keyboard. See docs/ios-keyboard.md.
 */

@available(iOS 18.0, *)
enum DeliveryMethod: String, AppEnum {
    case keep, whatsapp, messages, mail
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Send by"
    static var caseDisplayRepresentations: [DeliveryMethod: DisplayRepresentation] = [
        .keep: "Just copy it",
        .whatsapp: "WhatsApp",
        .messages: "Messages",
        .mail: "Mail",
    ]
}

@available(iOS 18.0, *)
enum DeliveryFile: String, AppEnum {
    case text, pdf
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "File type"
    static var caseDisplayRepresentations: [DeliveryFile: DisplayRepresentation] = [
        .text: "Text",
        .pdf: "PDF",
    ]
}

@available(iOS 18.0, *)
enum ReviewChoice: String, AppEnum {
    case go, change, cancel
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Next step"
    static var caseDisplayRepresentations: [ReviewChoice: DisplayRepresentation] = [
        .go: "Run it",
        .change: "Change something",
        .cancel: "Cancel",
    ]
}

/// Opens nothing: Siri needs some "next intent" to return when there is no chat to open.
@available(iOS 18.0, *)
struct EzyStayHereIntent: AppIntent {
    static var title: LocalizedStringResource = "Stay here"
    static var isDiscoverable: Bool { false }
    func perform() async throws -> some IntentResult { .result() }
}

enum EzyVoice {
    /// "mujhe invoice mai dikkat aa rahi hai", "invoice not working", "help with invoice".
    static func soundsLikeTrouble(_ text: String) -> Bool {
        let t = text.lowercased()
        let words = ["dikkat", "dikat", "problem", "issue", "samasya", "samasyaa", "help", "madad", "kaise", "nahi ho raha", "nahin ho raha", "not working", "stuck", "pareshani", "pareshan", "mushkil"]
        return words.contains { t.contains($0) } || t.contains("दिक्कत") || t.contains("समस्या") || t.contains("मदद") || t.contains("परेशान")
    }

    /// "making one", "banana hai", "create a new one", "naya".
    static func wantsToMake(_ text: String) -> Bool {
        let t = text.lowercased()
        let words = ["bana", "make", "making", "creat", "new", "naya", "nayi", "generate", "banwa", "likh", "write", "yes", "haan", "ha "]
        return words.contains { t.contains($0) } || t.contains("बना") || t.contains("नया") || t.contains("हां") || t.contains("हाँ")
    }

    static func digits(_ s: String) -> String { s.filter { $0.isNumber } }

    /// 10-digit Indian numbers get 91 in front, the way WhatsApp wants them.
    static func international(_ phone: String) -> String {
        let d = digits(phone)
        if d.count == 10 { return "91" + d }
        if d.count == 11, d.hasPrefix("0") { return "91" + d.dropFirst() }
        return d
    }

    static func encode(_ s: String) -> String { s.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? s }

    /// A name said aloud to a phone number or email from Contacts (only if the person allowed Contacts).
    static func contact(named name: String) -> (name: String, phone: String?, email: String?)? {
        guard CNContactStore.authorizationStatus(for: .contacts) == .authorized else { return nil }
        let keys = [CNContactGivenNameKey, CNContactFamilyNameKey, CNContactPhoneNumbersKey, CNContactEmailAddressesKey] as [CNKeyDescriptor]
        guard let hits = try? CNContactStore().unifiedContacts(matching: CNContact.predicateForContacts(matchingName: name), keysToFetch: keys),
              let c = hits.first else { return nil }
        let full = [c.givenName, c.familyName].filter { !$0.isEmpty }.joined(separator: " ")
        return (full, c.phoneNumbers.first?.value.stringValue, c.emailAddresses.first.map { String($0.value) })
    }

    /// The link that opens EZYOURLIFE on a saved PDF with the share sheet up (see EzyShareSheet).
    static func sharePDFURL(_ file: URL) -> URL? {
        var parts = URLComponents()
        parts.scheme = "ezyourlife"
        parts.host = "share-pdf"
        parts.queryItems = [URLQueryItem(name: "file", value: file.lastPathComponent)]
        return parts.url
    }

    static func url(method: DeliveryMethodKind, phone: String?, email: String?, title: String, text: String) -> URL? {
        switch method {
        case .whatsapp:
            let to = phone.map { international($0) } ?? ""
            return URL(string: "https://wa.me/\(to)" + (text.isEmpty ? "" : "?text=\(encode(text))"))
        case .messages:
            let to = phone.map { digits($0).isEmpty ? "" : "+" + international($0) } ?? ""
            return URL(string: "sms:\(to)" + (text.isEmpty ? "" : "&body=\(encode(text))"))
        case .mail:
            return URL(string: "mailto:\(email ?? "")?subject=\(encode(title))" + (text.isEmpty ? "" : "&body=\(encode(text))"))
        case .keep:
            return nil
        }
    }
}

enum DeliveryMethodKind { case keep, whatsapp, messages, mail }

@available(iOS 18.2, *)
struct AskEzyourlifeIntent: AppIntent {
    static var title: LocalizedStringResource = "Ask EZYOURLIFE"
    static var description = IntentDescription("Say what you need. EZYOURLIFE picks the right app, asks for the details one by one, makes it, and sends it to whoever you choose.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Request", requestValueDialog: "What do you need?")
    var request: String

    // Answers asked for during the conversation (Siri prompts for them from inside perform()).
    @Parameter(title: "Answer", default: "")
    var answer: String
    @Parameter(title: "Next step", default: ReviewChoice.go)
    var review: ReviewChoice
    @Parameter(title: "File type", default: DeliveryFile.text)
    var file: DeliveryFile
    @Parameter(title: "Send by", default: DeliveryMethod.keep)
    var method: DeliveryMethod

    private struct Outcome {
        var value = ""
        var dialog: String
        var open: URL?
    }

    func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog & OpensIntent {
        let out = try await conversation()
        if let url = out.open {
            return .result(value: out.value, opensIntent: OpenURLIntent(url), dialog: IntentDialog(stringLiteral: out.dialog))
        }
        return .result(value: out.value, opensIntent: EzyStayHereIntent(), dialog: IntentDialog(stringLiteral: out.dialog))
    }

    private func conversation() async throws -> Outcome {
        guard EzyShared.isConnected else {
            return Outcome(dialog: "Open the EZYOURLIFE app, go to Keyboard and voice, and tap Connect first.")
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
            return Outcome(value: hit.value, dialog: "Copied your \(hit.key) shortcut.")
        }

        // 2. An app.
        var plan: EzyPlan
        do { plan = try await EzyAPI.plan(spoken) } catch { return Outcome(dialog: error.localizedDescription) }
        guard var app = plan.app else {
            return Outcome(dialog: plan.message ?? "I couldn't find an app for that. Try other words.")
        }

        // "mujhe invoice mai dikkat aa rahi hai": ask what is wrong; "making one" carries on.
        if EzyVoice.soundsLikeTrouble(spoken) {
            let reply = try await $answer.requestValue(IntentDialog(stringLiteral: "\(app.name) mein kya dikkat aa rahi hai? What's the trouble? Say \"making one\" and I'll help you make it."))
            if !EzyVoice.wantsToMake(reply) {
                return Outcome(dialog: "Main \(app.name) banane mein madad kar sakta hoon. I can help make it. For anything else, open \(app.name) in the EZYOURLIFE app.")
            }
        }

        // Other apps that would also solve the problem: offer them by name, or "go" for the first.
        if EzyVoice.soundsLikeTrouble(spoken), let others = plan.alternatives, !others.isEmpty {
            let names = others.map(\.name).joined(separator: ", ")
            let reply = try await $answer.requestValue(IntentDialog(stringLiteral: "Main \(app.name) suggest karta hoon. Or you could use \(names). Say a name, or say go for \(app.name)."))
            let said = reply.lowercased()
            if let pick = others.first(where: { said.contains($0.name.lowercased()) }) {
                do { plan = try await EzyAPI.plan(spoken, appId: pick.id) } catch { return Outcome(dialog: error.localizedDescription) }
                app = plan.app ?? app
            }
        }

        // 3. Each box still empty, one at a time.
        var inputs = plan.inputs ?? [:]
        var asked = 0
        var missing = plan.missing ?? []
        while let next = missing.first, asked < 12 {
            missing.removeFirst()
            asked += 1
            let field = plan.fields?.first { $0.key == next.key }
            var question = "\(next.label)?"
            if let options = field?.options, !options.isEmpty { question += " " + options.prefix(5).joined(separator: ", ") + "." }
            let value = try await $answer.requestValue(IntentDialog(stringLiteral: question))
            inputs[next.key] = value.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        plan.inputs = inputs
        plan.missing = nil

        // 4. Read back, then Run / Change / Cancel. Nothing is charged before Run.
        var rounds = 0
        while rounds < 5 {
            rounds += 1
            let price = app.priceLabel.isEmpty ? "" : " for \(app.priceLabel)"
            let lines = (plan.fields ?? []).compactMap { f -> String? in
                guard let v = inputs[f.key], !v.isEmpty else { return nil }
                return "\(f.label): \(v)"
            }
            let summary = lines.isEmpty ? "" : lines.joined(separator: ". ") + ". "
            let choice = try await $review.requestDisambiguation(
                among: [.go, .change, .cancel],
                dialog: IntentDialog(stringLiteral: "\(app.name). \(summary)Run it\(price), change something, or cancel?")
            )
            if choice == .cancel { return Outcome(dialog: "Cancelled. Nothing was charged.") }
            if choice == .go { break }
            let labels = (plan.fields ?? []).map(\.label).joined(separator: ", ")
            let which = try await $answer.requestValue(IntentDialog(stringLiteral: "Which one? \(labels)"))
            let target = (plan.fields ?? []).first { f in
                let l = f.label.lowercased(), w = which.lowercased()
                return w.contains(l) || l.contains(w)
            }
            guard let target else { continue }
            let value = try await $answer.requestValue(IntentDialog(stringLiteral: "\(target.label)?"))
            inputs[target.key] = value.trimmingCharacters(in: .whitespacesAndNewlines)
            plan.inputs = inputs
        }

        // 5. Run, charged at the app's normal price.
        let result: EzyResult
        do { result = try await EzyAPI.run(plan) } catch { return Outcome(dialog: error.localizedDescription) }
        EzyShared.lastResult = result
        await EzyClipboard.copy(result)
        if result.imageURL != nil {
            return Outcome(value: result.text, dialog: "The image is copied. Paste it, or tap it in the EZYOURLIFE keyboard.")
        }

        // 6. File type, recipient and channel.
        let offersPDF = !["device", "image", "images", "coach"].contains(app.mode ?? "") && !result.text.isEmpty
        var wantsPDF = false
        if offersPDF {
            let remembered = EzyShared.store.string(forKey: "format.\(app.id)")
            if remembered == nil {
                wantsPDF = try await $file.requestDisambiguation(among: [.text, .pdf], dialog: IntentDialog(stringLiteral: "Text or PDF?")) == .pdf
            } else {
                wantsPDF = remembered == "pdf"
            }
        }
        let chosen = try await $method.requestDisambiguation(
            among: [.whatsapp, .messages, .mail, .keep],
            dialog: IntentDialog(stringLiteral: "Done. Send it by WhatsApp, Messages, Mail, or just copy it?")
        )
        let kind: DeliveryMethodKind = {
            switch chosen {
            case .whatsapp: return .whatsapp
            case .messages: return .messages
            case .mail: return .mail
            case .keep: return .keep
            }
        }()

        var body = result.text
        var savedPDF: URL?
        if wantsPDF {
            let letter = EzyPDF.template(id: app.id, name: app.name) == .letter
            let profile = letter ? await EzyAPI.profile() : [:]
            let pdf = EzyPDF.make(appId: app.id, title: app.name, markdown: result.text, profile: profile)
            EzyClipboard.copyPDF(pdf, name: app.name)
            savedPDF = EzyClipboard.saveToFiles(pdf, name: app.name)
            body = ""
        }
        if kind == .keep {
            if wantsPDF, let saved = savedPDF, let open = EzyVoice.sharePDFURL(saved) {
                return Outcome(value: result.text, dialog: "The PDF is saved in Files, in the EZYOURLIFE folder. Pick where to send it.", open: open)
            }
            return Outcome(value: result.text, dialog: wantsPDF ? "The PDF is saved in Files, in the EZYOURLIFE folder." : "Copied. Paste it, or tap it in the EZYOURLIFE keyboard.")
        }

        var phone: String?
        var email: String?
        var who = ""
        let heard = try await $answer.requestValue(IntentDialog(stringLiteral: kind == .mail ? "Who should I send it to? A name, or say the email." : "Who should I send it to? A name, or say the number."))
        if let found = EzyVoice.contact(named: heard) {
            who = found.name
            phone = found.phone
            email = found.email
        } else if EzyVoice.digits(heard).count >= 8 {
            phone = heard
            who = heard
        } else if heard.contains("@") || heard.lowercased().contains(" at ") {
            email = heard.replacingOccurrences(of: " at ", with: "@").replacingOccurrences(of: " dot ", with: ".").replacingOccurrences(of: " ", with: "")
            who = email ?? heard
        }
        // A PDF goes by the share sheet (a pasted PDF doesn't work in WhatsApp): the app opens on the saved file.
        var url = EzyVoice.url(method: kind, phone: phone, email: email, title: app.name, text: body)
        if wantsPDF, let saved = savedPDF, let share = EzyVoice.sharePDFURL(saved) { url = share }
        let how = wantsPDF ? "The PDF is saved in Files. Choose \(kind == .whatsapp ? "WhatsApp" : kind == .messages ? "Messages" : "Mail") and \(who.isEmpty ? "the chat" : who) in the share sheet, then tap Send." : "Tap Send."
        let to = who.isEmpty ? "" : " to \(who)"
        return Outcome(value: result.text, dialog: "Opening \(kind == .whatsapp ? "WhatsApp" : kind == .messages ? "Messages" : "Mail")\(to). \(how)", open: url)
    }
}

@available(iOS 18.2, *)
struct EzyAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AskEzyourlifeIntent(),
            phrases: [
                "Ask \(.applicationName)",
                "\(.applicationName) command",
                "Tell \(.applicationName)",
                "Talk to \(.applicationName)",
                "\(.applicationName) voice",
                "Hey \(.applicationName)",
            ],
            shortTitle: "Ask EZYOURLIFE",
            systemImageName: "mic.fill"
        )
    }
}
