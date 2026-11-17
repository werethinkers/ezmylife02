import Foundation
#if canImport(UIKit)
import UIKit
import CoreText
#endif

/*
 * Shared by the app, the EZYOURLIFE keyboard and the "Ask EZYOURLIFE" Siri command.
 * Compiled into both targets (App and Keyboard). See docs/ios-keyboard.md.
 *
 * The app and the keyboard share one App Group, so the keyboard can read what the app saved:
 *  - the person's API key ("EZYOURLIFE keyboard on iPhone", made on /keyboard in the app),
 *  - a copy of their synced shortcuts (same list as Speedy Notebook, EzMe and the Chrome extension),
 *  - the last result from a Siri / Action Button command, so it shows first in the keyboard strip.
 * A keyboard can read the App Group only when "Allow Full Access" is on.
 */
enum EzyShared {
    static let appGroup = "group.com.ezyourlife.app"
    static let api = URL(string: "https://vrsadzjyugbusfazdgyi.supabase.co/functions/v1/api/v1")!
    static let site = "https://ezyourlife.com"

    /// Opened once: the keyboard reads this on every key press, so it must stay cheap.
    static let store: UserDefaults = UserDefaults(suiteName: appGroup) ?? .standard

    /// Decoded copies kept in memory (the keyboard checks them on every key press). `reload()` drops them,
    /// for when the app or Siri may have changed the shared store from their own process.
    private static var cachedShortcuts: [EzyShortcut]?
    private static var cachedLastResult: EzyResult??
    private static var cachedRecentApps: [EzyApp]?
    private static var cachedApiKey: String??

    static func reload() {
        cachedShortcuts = nil
        cachedLastResult = nil
        cachedRecentApps = nil
        cachedApiKey = nil
    }

    private enum Key {
        static let apiKey = "ezy.apiKey"
        static let shortcuts = "ezy.shortcuts"
        static let shortcutsAt = "ezy.shortcutsAt"
        static let lastResult = "ezy.lastResult"
        static let recentApps = "ezy.recentApps"
    }

    static var apiKey: String? {
        get {
            if let cached = cachedApiKey { return cached }
            let key = store.string(forKey: Key.apiKey).flatMap { $0.isEmpty ? nil : $0 }
            cachedApiKey = .some(key)
            return key
        }
        set { store.set(newValue, forKey: Key.apiKey); cachedApiKey = .some(newValue) }
    }

    static var isConnected: Bool { apiKey != nil }

    static var shortcuts: [EzyShortcut] {
        get {
            if let cached = cachedShortcuts { return cached }
            let list = store.data(forKey: Key.shortcuts).flatMap { try? JSONDecoder().decode([EzyShortcut].self, from: $0) } ?? []
            cachedShortcuts = list
            return list
        }
        set {
            cachedShortcuts = newValue
            store.set(try? JSONEncoder().encode(newValue), forKey: Key.shortcuts)
            store.set(Date(), forKey: Key.shortcutsAt)
        }
    }

    static var shortcutsAge: TimeInterval {
        guard let at = store.object(forKey: Key.shortcutsAt) as? Date else { return .infinity }
        return Date().timeIntervalSince(at)
    }

    static var lastResult: EzyResult? {
        get {
            if let cached = cachedLastResult { return cached }
            let result = store.data(forKey: Key.lastResult).flatMap { try? JSONDecoder().decode(EzyResult.self, from: $0) }
            cachedLastResult = .some(result)
            return result
        }
        set { store.set(try? JSONEncoder().encode(newValue), forKey: Key.lastResult); cachedLastResult = .some(newValue) }
    }

    /// Apps the person ran from the keyboard or Siri, newest first. Shown when they type just "/".
    static var recentApps: [EzyApp] {
        get {
            if let cached = cachedRecentApps { return cached }
            let list = store.data(forKey: Key.recentApps).flatMap { try? JSONDecoder().decode([EzyApp].self, from: $0) } ?? []
            cachedRecentApps = list
            return list
        }
        set {
            let list = Array(newValue.prefix(8))
            cachedRecentApps = list
            store.set(try? JSONEncoder().encode(list), forKey: Key.recentApps)
        }
    }

    /// The wallet balance from the last run or charge, shown in the keyboard. Nil until the first one.
    static var balance: Int? {
        get { store.object(forKey: "ezy.balance") as? Int }
        set { store.set(newValue, forKey: "ezy.balance") }
    }

    static func remember(_ app: EzyApp) {
        recentApps = [app] + recentApps.filter { $0.id != app.id }
    }

    static func disconnect() {
        apiKey = nil
        shortcuts = []
        lastResult = nil
        recentApps = []
    }
}

// MARK: - Data

struct EzyShortcut: Codable, Hashable {
    var key: String
    var value: String
    var category: String?
}

struct EzyApp: Codable, Hashable {
    var id: String
    var name: String
    var credits: Int?
    var runnable: Bool?
    var url: String?
    /// "device": a photo tool that runs on the phone (EzyPhoto in the keyboard); the server only charges it.
    var mode: String?
    var description: String?
    var category: String?

    var link: String { url ?? "\(EzyShared.site)/tool/\(id)" }
    var priceLabel: String {
        guard let c = credits else { return "" }
        return c == 1 ? "1 credit" : "\(c) credits"
    }
}

struct EzyMissing: Codable, Hashable {
    var key: String
    var label: String
}

/// What POST /v1/command answers: the app that fits and its boxes filled in. Nothing has run yet.
struct EzyPlan: Codable {
    var app: EzyApp?
    var inputs: [String: String]?
    var prompt: String?
    var missing: [EzyMissing]?
    var ready: Bool?
    var message: String?
    /// Every box the app takes, shown in the keyboard for checking before it runs.
    var fields: [EzyField]?
    /// Boxes filled from the person's saved business details on ezyourlife.com.
    var fromProfile: [String]?
    /// Other apps that could solve the same problem, best first (the server fills this in).
    var alternatives: [EzyApp]?

    enum CodingKeys: String, CodingKey {
        case app, inputs, prompt, missing, ready, message, fields, alternatives
        case fromProfile = "from_profile"
    }
}

/// One box of an app (customer, amount, items…).
struct EzyField: Codable, Hashable {
    var key: String
    var label: String
    var type: String?
    var required: Bool?
    var placeholder: String?
    var options: [String]?
    var defaultValue: String?
    var help: String?

    enum CodingKeys: String, CodingKey {
        case key, label, type, required, placeholder, options, help
        case defaultValue = "default"
    }
}

/// A finished result, kept so the keyboard can offer it (Siri runs it while the person stays in their chat).
struct EzyResult: Codable {
    var title: String
    var text: String
    var imageURL: String?
    var at: Date
    /// Apps that make several pictures at once (ProductVision 360's angles): all of them, in order.
    var images: [String]? = nil
    /// Credits this run cost (from the server), when known.
    var charged: Int? = nil

    var isFresh: Bool { Date().timeIntervalSince(at) < 15 * 60 }
}

enum EzyError: LocalizedError {
    case notConnected
    case server(String)
    case network

    var errorDescription: String? {
        switch self {
        case .notConnected: return "Open the EZYOURLIFE app and connect the keyboard first."
        case .server(let message): return message
        case .network: return "No internet connection."
        }
    }
}

// MARK: - API (the public Ezyourlife API, docs/public-api.md)

enum EzyAPI {
    private static func request(_ path: String, method: String = "GET", body: [String: Any]? = nil, auth: Bool = true) async throws -> [String: Any] {
        guard let url = URL(string: EzyShared.api.absoluteString + path) else { throw EzyError.server("Bad address.") }
        var req = URLRequest(url: url, timeoutInterval: 150) // image apps can take a minute or two
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if auth {
            guard let key = EzyShared.apiKey else { throw EzyError.notConnected }
            req.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        }
        if let body { req.httpBody = try JSONSerialization.data(withJSONObject: body) }
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw EzyError.network
        }
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if status == 401 { throw EzyError.notConnected }
        if status >= 400 || (json["ok"] as? Bool) == false {
            throw EzyError.server((json["message"] as? String) ?? "Something went wrong (\(status)).")
        }
        return json
    }

    /// The person's saved business details (for the letterhead on Letter PDFs). Empty when none or offline.
    static func profile() async -> [String: String] {
        guard let json = try? await request("/profile") else { return [:] }
        return (json["profile"] as? [String: Any] ?? [:]).compactMapValues { $0 as? String }
    }

    private static func decode<T: Decodable>(_ type: T.Type, _ object: Any?) -> T? {
        guard let object, JSONSerialization.isValidJSONObject(object),
              let data = try? JSONSerialization.data(withJSONObject: object) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }

    /// The person's synced shortcuts. Saves a copy in the App Group for quick, offline matching.
    @discardableResult
    static func refreshShortcuts() async throws -> [EzyShortcut] {
        let json = try await request("/shortcuts")
        let list = decode([EzyShortcut].self, json["shortcuts"]) ?? []
        EzyShared.shortcuts = list
        return list
    }

    /// Ranked search of live apps (free, no key needed).
    static func searchApps(_ query: String, limit: Int = 6) async throws -> [EzyApp] {
        let q = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let json = try await request("/apps?q=\(q)&limit=\(limit)", auth: false)
        return decode([EzyApp].self, json["apps"]) ?? []
    }

    /// One sentence -> the best app with its boxes filled in. Free; runs nothing.
    static func plan(_ text: String, appId: String? = nil) async throws -> EzyPlan {
        var body: [String: Any] = ["text": text]
        if let appId { body["app_id"] = appId }
        let json = try await request("/command", method: "POST", body: body)
        return decode(EzyPlan.self, json) ?? EzyPlan(app: nil, message: "No app matched.", fields: nil, fromProfile: nil)
    }

    /// Charges a photo tool that ran on the phone, at its website price.
    static func chargeDevice(_ appId: String) async throws {
        let id = appId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? appId
        let json = try await request("/apps/\(id)/charge", method: "POST", body: [:])
        if let b = json["balance"] as? Int { EzyShared.balance = b }
    }

    /// The wallet balance, saved for the keyboard's balance pill.
    @discardableResult
    static func refreshBalance() async -> Int? {
        guard let json = try? await request("/wallet"), let b = json["balance"] as? Int else { return nil }
        EzyShared.balance = b
        return b
    }

    /// Runs the app, charged at its normal price. Returns the result as text (and an image link for image apps).
    static func run(_ plan: EzyPlan) async throws -> EzyResult {
        guard let app = plan.app else { throw EzyError.server("No app to run.") }
        var body: [String: Any] = [:]
        if let inputs = plan.inputs, !inputs.isEmpty { body["inputs"] = inputs }
        if let prompt = plan.prompt, !prompt.isEmpty { body["prompt"] = prompt }
        let id = app.id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? app.id
        let json = try await request("/apps/\(id)/run", method: "POST", body: body)
        EzyShared.remember(app)
        if let b = json["balance"] as? Int { EzyShared.balance = b }
        let spent = json["credits_charged"] as? Int
        var image: String? = json["image"] as? String
        var text = EzyText.flatten(json["output"])
        if image == nil, let s = json["output"] as? String, s.hasPrefix("data:image") || (s.hasPrefix("http") && !s.contains(" ")) {
            image = s
            text = ""
        }
        // Several pictures: plain links or { image } objects.
        let many = (json["images"] as? [Any] ?? []).compactMap { item -> String? in
            if let s = item as? String { return s }
            if let d = item as? [String: Any] { return (d["image"] ?? d["url"]) as? String }
            return nil
        }
        if image == nil { image = many.first }
        if text.isEmpty { text = image != nil ? "" : app.link }
        // A video can't be pasted as a picture: hand over its link.
        if let link = image, link.hasPrefix("http"), link.range(of: #"\.(mp4|mov|webm)(\?|$)"#, options: .regularExpression) != nil {
            return EzyResult(title: app.name, text: link, imageURL: nil, at: Date())
        }
        var result = EzyResult(title: app.name, text: text, imageURL: image, at: Date())
        if many.count > 1 { result.images = many }
        result.charged = spent
        return result
    }

    /// Coaching apps, one message at a time. "start" is charged (the session price) and returns a ticket;
    /// "turn" and "wrap" send the ticket and the conversation and are free.
    static func coach(_ appId: String, action: String, inputs: [String: String] = [:], ticket: String? = nil, messages: [[String: String]] = []) async throws -> (text: String, ticket: String?) {
        var body: [String: Any] = ["action": action]
        if !inputs.isEmpty { body["inputs"] = inputs }
        if let ticket { body["ticket"] = ticket }
        if !messages.isEmpty { body["messages"] = messages }
        let id = appId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? appId
        let json = try await request("/apps/\(id)/run", method: "POST", body: body)
        return (EzyText.flatten(json["output"]), json["ticket"] as? String)
    }
}

// MARK: - Turning app output into plain text

enum EzyText {
    /// Apps answer with text, or with JSON documents (title, sections, rows). The keyboard types plain text.
    static func flatten(_ value: Any?) -> String {
        var lines: [String] = []
        walk(value, into: &lines, depth: 0)
        return lines.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static let skip: Set<String> = ["id", "type", "kind", "style", "color", "icon", "cached", "ok", "run_id", "credits_charged", "balance"]

    private static func walk(_ value: Any?, into lines: inout [String], depth: Int) {
        guard depth < 8, let value else { return }
        if let s = value as? String {
            let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
            if !t.isEmpty && !t.hasPrefix("data:") { lines.append(t) }
        } else if let n = value as? NSNumber {
            lines.append(n.stringValue)
        } else if let list = value as? [Any] {
            for item in list {
                if let s = item as? String { lines.append("• " + s) } else { walk(item, into: &lines, depth: depth + 1) }
            }
        } else if let dict = value as? [String: Any] {
            let order = ["title", "heading", "name", "summary", "intro", "text", "body", "content", "sections", "items", "rows"]
            let keys = dict.keys.sorted { a, b in
                let ia = order.firstIndex(of: a) ?? order.count, ib = order.firstIndex(of: b) ?? order.count
                return ia == ib ? a < b : ia < ib
            }
            for key in keys where !skip.contains(key) {
                let v = dict[key]
                if v is [String: Any] || v is [Any], !["sections", "items", "rows", "content"].contains(key) {
                    lines.append("")
                    lines.append(key.replacingOccurrences(of: "_", with: " ").capitalized + ":")
                }
                walk(v, into: &lines, depth: depth + 1)
            }
        }
    }
}

// MARK: - Matching what the person typed

enum EzyMatch {
    /// Orders app results for the strip: apps that run in the keyboard first, then names that start with
    /// (or have a word starting with) what was typed. Also keeps older results sensible while a newer search runs.
    static func rank(_ apps: [EzyApp], for word: String) -> [EzyApp] {
        let w = word.lowercased()
        func score(_ a: EzyApp) -> Int {
            let name = a.name.lowercased()
            var s = 0
            if name.hasPrefix(w) { s += 6 } else if name.split(separator: " ").contains(where: { $0.hasPrefix(w) }) { s += 4 } else if name.contains(w) { s += 2 }
            if a.runnable != false { s += 3 }
            return s
        }
        return apps.enumerated().sorted { l, r in
            let (a, b) = (score(l.element), score(r.element))
            return a != b ? a > b : l.offset < r.offset
        }.map(\.element)
    }

    /// The command being typed: everything after the last "/" or "\" on the current line, if it started a word.
    /// "Hi /inv" -> "inv". "Send /invo Rahul 5000" -> "invo Rahul 5000". "a/b" -> nil (a slash inside a word).
    static func command(in before: String?) -> (text: String, length: Int)? {
        guard let before, !before.isEmpty else { return nil }
        let line = before.components(separatedBy: "\n").last ?? ""
        guard let idx = line.lastIndex(where: { $0 == "/" || $0 == "\\" }) else { return nil }
        if idx > line.startIndex {
            let prev = line[line.index(before: idx)]
            if !prev.isWhitespace { return nil }
        }
        let after = String(line[line.index(after: idx)...])
        if after.count > 120 || after.hasPrefix(" ") { return nil }
        return (after, after.count + 1)
    }

    /// Shortcuts whose key starts with, or whose key or text contains, the first word typed.
    static func shortcuts(_ list: [EzyShortcut], for query: String, limit: Int = 8) -> [EzyShortcut] {
        let word = query.split(separator: " ").first.map(String.init)?.lowercased() ?? ""
        if word.isEmpty { return Array(list.prefix(limit)) }
        let scored: [(EzyShortcut, Int)] = list.compactMap { s in
            let key = s.key.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: "/\\"))
            if key == word { return (s, 100) }
            if key.hasPrefix(word) { return (s, 80 - key.count) }
            if key.contains(word) { return (s, 40) }
            if s.value.lowercased().contains(word) { return (s, 10) }
            return nil
        }
        return scored.sorted { $0.1 > $1.1 }.prefix(limit).map { $0.0 }
    }
}

#if canImport(UIKit)
enum EzyClipboard {
    /// Copies a PDF as a named file, the way the Files app does, so chat apps such as
    /// WhatsApp paste it as a document. Notes and Mail still read the raw PDF data.
    static func copyPDF(_ data: Data, name: String) {
        let clean = name.components(separatedBy: CharacterSet(charactersIn: "/\\:?*\"<>|")).joined()
        let file = (clean.isEmpty ? "EZYOURLIFE" : clean) + ".pdf"
        let folder = (FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: EzyShared.appGroup)
            ?? FileManager.default.temporaryDirectory).appendingPathComponent("Paste", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let url = folder.appendingPathComponent(file)
        try? data.write(to: url, options: .atomic)
        let provider = NSItemProvider()
        provider.suggestedName = file
        provider.registerFileRepresentation(forTypeIdentifier: "com.adobe.pdf", fileOptions: [], visibility: .all) { done in
            done(url, false, nil)
            return nil
        }
        provider.registerDataRepresentation(forTypeIdentifier: "com.adobe.pdf", visibility: .all) { done in
            done(data, nil)
            return nil
        }
        UIPasteboard.general.setItemProviders([provider], localOnly: false, expirationDate: nil)
    }

    /// Saves a PDF where the person can find it in the Files app (On My iPhone > EZYOURLIFE) and returns it.
    /// The app and Siri write straight into the app's Documents folder, which Files shows (Info.plist:
    /// UIFileSharingEnabled). The keyboard can't write there, so it saves into the shared App Group
    /// and the app moves it over the next time it opens (`mirrorToFiles`).
    @discardableResult
    static func saveToFiles(_ data: Data, name: String) -> URL? {
        let clean = name.components(separatedBy: CharacterSet(charactersIn: "/\\:?*\"<>|")).joined()
        let stamp = DateFormatter()
        stamp.dateFormat = "yyyy-MM-dd HHmm"
        let file = (clean.isEmpty ? "EZYOURLIFE" : clean) + " " + stamp.string(from: Date()) + ".pdf"
        let fm = FileManager.default
        let inApp = Bundle.main.bundleURL.pathExtension == "app"
        let base: URL?
        if inApp {
            base = fm.urls(for: .documentDirectory, in: .userDomainMask).first
        } else {
            base = fm.containerURL(forSecurityApplicationGroupIdentifier: EzyShared.appGroup)?.appendingPathComponent("Exports", isDirectory: true)
        }
        guard let folder = base else { return nil }
        try? fm.createDirectory(at: folder, withIntermediateDirectories: true)
        let url = folder.appendingPathComponent(file)
        do { try data.write(to: url, options: .atomic) } catch { return nil }
        return url
    }

    /// App only: moves PDFs the keyboard saved in the App Group into the Files folder.
    static func mirrorToFiles() {
        let fm = FileManager.default
        guard Bundle.main.bundleURL.pathExtension == "app",
              let group = fm.containerURL(forSecurityApplicationGroupIdentifier: EzyShared.appGroup)?.appendingPathComponent("Exports", isDirectory: true),
              let docs = fm.urls(for: .documentDirectory, in: .userDomainMask).first,
              let files = try? fm.contentsOfDirectory(at: group, includingPropertiesForKeys: nil) else { return }
        for file in files where file.pathExtension.lowercased() == "pdf" {
            let target = docs.appendingPathComponent(file.lastPathComponent)
            if fm.fileExists(atPath: target.path) { try? fm.removeItem(at: file); continue }
            try? fm.moveItem(at: file, to: target)
        }
    }

    /// Copies a result: the text, or the image itself when the app made one.
    static func copy(_ result: EzyResult) async {
        if let many = result.images, many.count > 1 {
            var pictures: [UIImage] = []
            for link in many { if let image = await loadImage(link) { pictures.append(image) } }
            if !pictures.isEmpty {
                await MainActor.run { UIPasteboard.general.images = pictures }
                return
            }
        }
        if let link = result.imageURL, let image = await loadImage(link) {
            await MainActor.run { UIPasteboard.general.image = image }
        } else if !result.text.isEmpty {
            await MainActor.run { UIPasteboard.general.string = result.text }
        }
    }

    static func loadImage(_ link: String) async -> UIImage? {
        if link.hasPrefix("data:"), let comma = link.firstIndex(of: ",") {
            let b64 = String(link[link.index(after: comma)...])
            return Data(base64Encoded: b64).flatMap(UIImage.init(data:))
        }
        guard let url = URL(string: link), let pair = try? await URLSession.shared.data(from: url) else { return nil }
        return UIImage(data: pair.0)
    }
}
#endif


// MARK: - Answers for a chat box

enum EzyChat {
    /// Markdown from the apps, made right for WhatsApp and other chats: *bold* instead of **bold**,
    /// headings as bold lines, and lines that only hold blanks like "[Bank Name]" left out.
    static func forChat(_ text: String) -> String {
        var out: [String] = []
        for raw in text.components(separatedBy: "\n") {
            var line = raw
            if line.range(of: #"\[[A-Za-z][A-Za-z /&()'-]{1,40}\]"#, options: .regularExpression) != nil,
               line.range(of: #"\]\("#, options: .regularExpression) == nil {
                continue // an unfilled blank: better left out than sent
            }
            if let r = line.range(of: #"^\s{0,3}#{1,6}\s+"#, options: .regularExpression) {
                let title = line[r.upperBound...].replacingOccurrences(of: "**", with: "").trimmingCharacters(in: .whitespaces)
                line = title.isEmpty ? "" : "*\(title)*"
            } else {
                line = line.replacingOccurrences(of: "**", with: "*").replacingOccurrences(of: "__", with: "_")
                if let r = line.range(of: #"^\s*[-*]\s+"#, options: .regularExpression), !line.hasPrefix("*") || line.hasPrefix("* ") {
                    line = "• " + line[r.upperBound...]
                }
            }
            if line.range(of: #"^\s*\|?\s*:?-{3,}"#, options: .regularExpression) != nil { continue } // table rule
            if line.hasPrefix("|") {
                line = line.trimmingCharacters(in: CharacterSet(charactersIn: "| ")).replacingOccurrences(of: " | ", with: " · ").replacingOccurrences(of: "|", with: " · ")
            }
            if line.trimmingCharacters(in: .whitespaces) == "---" { continue }
            if line.isEmpty && (out.last?.isEmpty ?? true) { continue }
            out.append(line)
        }
        return out.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

#if canImport(UIKit)
// MARK: - A clean A4 PDF from an app's answer
// Matches the website's PDF templates (src/apps/output/choice.ts and render.ts, docs/output-formats.md):
// Letter (business letterhead), Plan, Document; A4, ink #121212, accent bar per template, a title bar with the
// app name as a kicker, and "App · Made with ezyourlife.com" / "Page x of n" on every page.

enum EzyPDF {
    enum Template { case letter, plan, document }

    static let ink = UIColor(red: 0x12 / 255, green: 0x12 / 255, blue: 0x12 / 255, alpha: 1)
    static let sun = UIColor(red: 1, green: 0xcc / 255, blue: 0, alpha: 1)
    static let lime = UIColor(red: 0xb6 / 255, green: 0xf2 / 255, blue: 0x2e / 255, alpha: 1)

    /// Same rule as the website: names like letter, notice, invoice or contract get the Letter; plans and
    /// schedules get the Plan; everything else is a Document.
    static func template(id: String, name: String) -> Template {
        let s = (id + " " + name).lowercased().replacingOccurrences(of: "-", with: " ")
        if s.range(of: #"\b(comparison|register|calendar)\b"#, options: .regularExpression) == nil,
           s.range(of: #"\b(letter|notice|agreement|invoice|quotation|quote|slip|certificate|application|nda|contract|deed|receipt|proforma|offer|undertaking|affidavit|declaration|resignation|appointment|reference|memo)\b"#, options: .regularExpression) != nil {
            return .letter
        }
        if s.range(of: #"\b(plan|planner|schedule|timetable|itinerary|routine|roadmap)\b"#, options: .regularExpression) != nil { return .plan }
        return .document
    }

    // Headings: a heavy rounded face, the nearest built-in to the site's Unbounded. Body: the system face
    // (Devanagari falls back to Apple's Hindi fonts).
    static func heading(_ size: CGFloat) -> UIFont {
        let base = UIFont.systemFont(ofSize: size, weight: .heavy)
        if let d = base.fontDescriptor.withDesign(.rounded) { return UIFont(descriptor: d, size: size) }
        return base
    }

    /// `profile` is the person's saved business details (letterhead on Letter templates).
    static func make(appId: String, title: String, markdown: String, profile: [String: String] = [:]) -> Data {
        let kind = template(id: appId, name: title)
        let accent = kind == .plan ? lime : sun
        let page = CGRect(x: 0, y: 0, width: 595, height: 842)
        let body = page.insetBy(dx: 48, dy: 0)
        let headerHeight: CGFloat = kind == .letter && !(profile["businessName"] ?? "").isEmpty ? 132 : 112
        let bottom: CGFloat = 60
        let text = attributed(markdown, width: body.width, accent: accent)
        let setter = CTFramesetterCreateWithAttributedString(text as CFAttributedString)
        let frameRect = CGRect(x: body.minX, y: bottom, width: body.width, height: page.height - headerHeight - bottom)

        // Pass 1: where each page starts, so the footer can say "Page x of n".
        var starts: [Int] = []
        var at = 0
        repeat {
            starts.append(at)
            let frame = CTFramesetterCreateFrame(setter, CFRange(location: at, length: 0), CGPath(rect: frameRect, transform: nil), nil)
            at += max(CTFrameGetVisibleStringRange(frame).length, 1)
        } while at < text.length && starts.count < 60
        let date = DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .none)
        let grey = UIColor(white: 0.45, alpha: 1)

        return UIGraphicsPDFRenderer(bounds: page).pdfData { ctx in
            for (n, start) in starts.enumerated() {
                ctx.beginPage()
                let cg = ctx.cgContext
                accent.setFill()
                cg.fill(CGRect(x: 0, y: 0, width: page.width, height: 8))
                if kind == .letter, let business = profile["businessName"], !business.isEmpty {
                    // Letterhead: name, industry as tagline, then address, phone · email, GSTIN, website.
                    (business as NSString).draw(in: CGRect(x: body.minX, y: 26, width: body.width * 0.6, height: 26), withAttributes: [.font: heading(18), .foregroundColor: ink])
                    if let tag = profile["industry"], !tag.isEmpty {
                        (tag as NSString).draw(in: CGRect(x: body.minX, y: 52, width: body.width * 0.6, height: 16), withAttributes: [.font: UIFont.systemFont(ofSize: 10), .foregroundColor: grey])
                    }
                    let contact = [profile["address"], [profile["phone"], profile["email"]].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "), profile["gstin"].map { "GSTIN \($0)" }, profile["website"]]
                        .compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: "\n")
                    (contact as NSString).draw(in: CGRect(x: body.minX + body.width * 0.55, y: 26, width: body.width * 0.45, height: 64), withAttributes: [.font: UIFont.systemFont(ofSize: 9), .foregroundColor: grey, .paragraphStyle: right()])
                    UIColor(white: 0.85, alpha: 1).setFill()
                    cg.fill(CGRect(x: body.minX, y: 94, width: body.width, height: 1))
                    (title.uppercased() as NSString).draw(at: CGPoint(x: body.minX, y: 104), withAttributes: [.font: heading(11), .foregroundColor: ink, .kern: 1.2])
                    (date as NSString).draw(in: CGRect(x: body.midX, y: 104, width: body.width / 2, height: 14), withAttributes: [.font: UIFont.systemFont(ofSize: 10), .foregroundColor: grey, .paragraphStyle: right()])
                } else {
                    // Title bar: the app name as a small kicker above the title, the date at right.
                    (title.uppercased() as NSString).draw(at: CGPoint(x: body.minX, y: 28), withAttributes: [.font: UIFont.systemFont(ofSize: 9, weight: .bold), .foregroundColor: grey, .kern: 1.4])
                    (date as NSString).draw(in: CGRect(x: body.midX, y: 28, width: body.width / 2, height: 14), withAttributes: [.font: UIFont.systemFont(ofSize: 10), .foregroundColor: grey, .paragraphStyle: right()])
                    (title as NSString).draw(in: CGRect(x: body.minX, y: 44, width: body.width, height: 34), withAttributes: [.font: heading(22), .foregroundColor: ink])
                    accent.setFill()
                    cg.fill(CGRect(x: body.minX, y: 86, width: 56, height: 4))
                }
                // Footer
                ("\(title) · Made with ezyourlife.com" as NSString).draw(at: CGPoint(x: body.minX, y: page.height - 36), withAttributes: [.font: UIFont.systemFont(ofSize: 9), .foregroundColor: grey])
                ("Page \(n + 1) of \(starts.count)" as NSString).draw(in: CGRect(x: body.midX, y: page.height - 36, width: body.width / 2, height: 14), withAttributes: [.font: UIFont.systemFont(ofSize: 9), .foregroundColor: grey, .paragraphStyle: right()])
                // Body (CoreText draws with a flipped y axis)
                cg.saveGState()
                cg.translateBy(x: 0, y: page.height)
                cg.scaleBy(x: 1, y: -1)
                let frame = CTFramesetterCreateFrame(setter, CFRange(location: start, length: 0), CGPath(rect: frameRect, transform: nil), nil)
                CTFrameDraw(frame, cg)
                cg.restoreGState()
            }
        }
    }

    private static func right() -> NSParagraphStyle {
        let p = NSMutableParagraphStyle()
        p.alignment = .right
        return p
    }

    private static func inline(_ line: String, font: UIFont, bold: UIFont, color: UIColor) -> NSMutableAttributedString {
        let out = NSMutableAttributedString()
        let parts = line.components(separatedBy: "**")
        for (i, part) in parts.enumerated() {
            out.append(NSAttributedString(string: part, attributes: [.font: i % 2 == 1 ? bold : font, .foregroundColor: color]))
        }
        return out
    }

    private static func attributed(_ markdown: String, width: CGFloat, accent: UIColor) -> NSAttributedString {
        let out = NSMutableAttributedString()
        let regular = UIFont.systemFont(ofSize: 11)
        let strong = UIFont.systemFont(ofSize: 11, weight: .semibold)
        func para(spacingBefore: CGFloat = 0, after: CGFloat = 4, indent: CGFloat = 0, tabs: [NSTextTab] = []) -> NSParagraphStyle {
            let p = NSMutableParagraphStyle()
            p.paragraphSpacingBefore = spacingBefore
            p.paragraphSpacing = after
            p.lineSpacing = 2
            p.headIndent = indent
            p.tabStops = tabs
            return p
        }
        for raw in markdown.components(separatedBy: "\n") {
            var line = raw.trimmingCharacters(in: .whitespaces)
            if line.isEmpty || line == "---" || line.range(of: #"^\|?\s*:?-{3,}"#, options: .regularExpression) != nil { continue }
            var piece: NSMutableAttributedString
            if let r = line.range(of: #"^#{1,6}\s+"#, options: .regularExpression) {
                let level = line[..<r.upperBound].filter { $0 == "#" }.count
                line = String(line[r.upperBound...]).replacingOccurrences(of: "**", with: "")
                let font = level <= 2 ? heading(level <= 1 ? 15 : 13) : UIFont.systemFont(ofSize: 12, weight: .bold)
                piece = NSMutableAttributedString(string: line, attributes: [.font: font, .foregroundColor: ink, .underlineStyle: level <= 2 ? NSUnderlineStyle.thick.rawValue : 0, .underlineColor: accent])
                piece.addAttribute(.paragraphStyle, value: para(spacingBefore: 10, after: 5), range: NSRange(location: 0, length: piece.length))
            } else if line.hasPrefix("|") {
                let cells = line.trimmingCharacters(in: CharacterSet(charactersIn: "|")).components(separatedBy: "|").map { $0.trimmingCharacters(in: .whitespaces) }
                let step = width / CGFloat(max(cells.count, 1))
                let tabs = (1..<max(cells.count, 2)).map { NSTextTab(textAlignment: .left, location: CGFloat($0) * step) }
                piece = inline(cells.joined(separator: "\t"), font: regular, bold: strong, color: ink)
                piece.addAttribute(.paragraphStyle, value: para(after: 3, tabs: tabs), range: NSRange(location: 0, length: piece.length))
            } else if let r = line.range(of: #"^([-*•]|\d+[.)])\s+"#, options: .regularExpression) {
                let mark = line[..<r.upperBound].trimmingCharacters(in: .whitespaces)
                let bullet = mark.first?.isNumber == true ? mark : "•"
                piece = inline("\(bullet)\t" + line[r.upperBound...], font: regular, bold: strong, color: ink)
                piece.addAttribute(.paragraphStyle, value: para(after: 3, indent: 16, tabs: [NSTextTab(textAlignment: .left, location: 16)]), range: NSRange(location: 0, length: piece.length))
            } else {
                piece = inline(line, font: regular, bold: strong, color: ink)
                piece.addAttribute(.paragraphStyle, value: para(after: 6), range: NSRange(location: 0, length: piece.length))
            }
            piece.append(NSAttributedString(string: "\n"))
            out.append(piece)
        }
        return out
    }
}
#endif
