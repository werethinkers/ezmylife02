import Foundation
#if canImport(UIKit)
import UIKit
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

    enum CodingKeys: String, CodingKey {
        case app, inputs, prompt, missing, ready, message, fields
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
}

/// A finished result, kept so the keyboard can offer it (Siri runs it while the person stays in their chat).
struct EzyResult: Codable {
    var title: String
    var text: String
    var imageURL: String?
    var at: Date

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
        var req = URLRequest(url: url, timeoutInterval: 60)
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

    /// Runs the app, charged at its normal price. Returns the result as text (and an image link for image apps).
    static func run(_ plan: EzyPlan) async throws -> EzyResult {
        guard let app = plan.app else { throw EzyError.server("No app to run.") }
        var body: [String: Any] = [:]
        if let inputs = plan.inputs, !inputs.isEmpty { body["inputs"] = inputs }
        if let prompt = plan.prompt, !prompt.isEmpty { body["prompt"] = prompt }
        let id = app.id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? app.id
        let json = try await request("/apps/\(id)/run", method: "POST", body: body)
        EzyShared.remember(app)
        var image: String? = json["image"] as? String
        var text = EzyText.flatten(json["output"])
        if image == nil, let s = json["output"] as? String, s.hasPrefix("data:image") || (s.hasPrefix("http") && !s.contains(" ")) {
            image = s
            text = ""
        }
        if text.isEmpty { text = image != nil ? "" : app.link }
        return EzyResult(title: app.name, text: text, imageURL: image, at: Date())
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
    /// Copies a result: the text, or the image itself when the app made one.
    static func copy(_ result: EzyResult) async {
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
