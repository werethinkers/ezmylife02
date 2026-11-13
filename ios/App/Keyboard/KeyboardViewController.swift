import UIKit
import ImageIO
import CoreImage
import Vision
import PDFKit

/*
 * The EZYOURLIFE keyboard: a normal iPhone-style keyboard with one strip on top.
 *
 * Type "/" (or "\") and a few letters in any app, and the strip shows your shortcuts and Ezyourlife apps:
 *   /pm             -> tap "pm" and its text replaces "/pm"
 *   /invo           -> tap "Proforma Invoice": a details card opens with your saved business details filled in
 *   / + the mic     -> say "proforma invoice for Rahul Traders, 2 chairs at 1500": the card opens filled from your words
 * On the card: tap a box to type in it (or say more after the command), then Generate: the result replaces the command.
 * A result made with Siri or the Action Button ("Ask EZYOURLIFE") shows first, ready to tap in.
 *
 * Apple rules this follows: a keyboard can't record audio itself (iOS's own dictation mic types into the
 * box, and the card reads what it typed; Siri is the hands-free way),
 * needs "Allow Full Access" to reach the internet and the app's shared data, and can't put a photo
 * straight into another app's box (images are copied for the person to paste).
 * Shared code: ios/App/Shared/EzyShared.swift. Guide: docs/ios-keyboard.md.
 */
final class KeyboardViewController: UIInputViewController {

    // MARK: Layout state

    private enum Page { case letters, numbers, symbols }
    private enum Shift { case off, once, locked }

    private var page: Page = .letters
    private var shift: Shift = .once
    private var lastShiftTap = Date.distantPast
    private var lastSpaceTap = Date.distantPast

    private let strip = UIScrollView()
    private let stripStack = UIStackView()
    private let keysStack = KeysStack()
    /// What the keys were last drawn for; they are redrawn only when this changes, not on every press.
    private var keysSignature = ""
    /// What the strip was last drawn for, for the same reason.
    private var stripSignature = ""
    private var heightConstraint: NSLayoutConstraint?

    private var deleteTimer: Timer?
    private var deleteRepeats = 0

    // MARK: Strip state

    private var appResults: [EzyApp] = []
    private var lastQuery = ""
    private var searchTask: Task<Void, Never>?
    private var busy: String?
    private var notice: String?

    // MARK: Details card state

    /// The app chosen for the command, with its boxes, while the person checks them before it runs.
    private struct Card {
        var plan: EzyPlan
        var app: EzyApp
        var fields: [EzyField]
        var values: [String: String]
        var fromProfile: Set<String>
        var edited: Set<String> = []
        var commandText: String
    }
    private static let promptKey = "__prompt"
    private var card: Card?
    private var editingKey: String?
    private let cardView = UIView()
    private var planTask: Task<Void, Never>?
    private var suggestion: (text: String, plan: EzyPlan)?
    private var plannedText = ""
    private var lastWordCount = 0

    // MARK: Colours (close to Apple's own keyboard)

    private var dark: Bool {
        textDocumentProxy.keyboardAppearance == .dark || traitCollection.userInterfaceStyle == .dark
    }
    private var letterKeyColor: UIColor { dark ? UIColor(white: 0.42, alpha: 1) : .white }
    private var functionKeyColor: UIColor { dark ? UIColor(white: 0.27, alpha: 1) : UIColor(red: 0.67, green: 0.69, blue: 0.74, alpha: 1) }
    private var keyTextColor: UIColor { dark ? .white : .black }
    private var chipColor: UIColor { dark ? UIColor(white: 0.32, alpha: 1) : .white }
    private let brand = UIColor(red: 1.0, green: 0.42, blue: 0.29, alpha: 1) // Ezyourlife coral

    // MARK: Life cycle

    override func loadView() {
        let input = KeyboardInputView(frame: .zero, inputViewStyle: .keyboard)
        input.allowsSelfSizing = true
        view = input
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        let container = view!
        // Two thumbs overlap when typing fast: without this, the second key's touch is dropped.
        container.isMultipleTouchEnabled = true
        keysStack.isMultipleTouchEnabled = true

        strip.showsHorizontalScrollIndicator = false
        strip.translatesAutoresizingMaskIntoConstraints = false
        stripStack.axis = .horizontal
        stripStack.spacing = 6
        stripStack.alignment = .center
        stripStack.translatesAutoresizingMaskIntoConstraints = false
        strip.addSubview(stripStack)

        keysStack.axis = .vertical
        keysStack.spacing = 11
        keysStack.distribution = .fillEqually
        keysStack.translatesAutoresizingMaskIntoConstraints = false

        cardView.translatesAutoresizingMaskIntoConstraints = false
        cardView.isHidden = true

        container.addSubview(strip)
        container.addSubview(keysStack)
        container.addSubview(cardView)

        NSLayoutConstraint.activate([
            strip.topAnchor.constraint(equalTo: container.topAnchor, constant: 4),
            strip.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 4),
            strip.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -4),
            strip.heightAnchor.constraint(equalToConstant: 40),

            stripStack.topAnchor.constraint(equalTo: strip.contentLayoutGuide.topAnchor),
            stripStack.bottomAnchor.constraint(equalTo: strip.contentLayoutGuide.bottomAnchor),
            stripStack.leadingAnchor.constraint(equalTo: strip.contentLayoutGuide.leadingAnchor, constant: 2),
            stripStack.trailingAnchor.constraint(equalTo: strip.contentLayoutGuide.trailingAnchor, constant: -2),
            stripStack.heightAnchor.constraint(equalTo: strip.frameLayoutGuide.heightAnchor),

            keysStack.topAnchor.constraint(equalTo: strip.bottomAnchor, constant: 6),
            keysStack.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 3),
            keysStack.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -3),
            keysStack.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -4),

            cardView.topAnchor.constraint(equalTo: strip.bottomAnchor, constant: 4),
            cardView.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 6),
            cardView.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -6),
            cardView.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -4),
        ])
        let h = container.heightAnchor.constraint(equalToConstant: 270)
        h.priority = UILayoutPriority(999)
        h.isActive = true
        heightConstraint = h

        buildKeys()
        refreshStrip()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        EzyShared.reload() // the app or Siri may have saved something new
        updateAutoShift()
        buildKeys(force: true)
        refreshStrip(force: true)
        if hasFullAccess, EzyShared.isConnected, EzyShared.shortcutsAge > 300 {
            Task { [weak self] in
                _ = try? await EzyAPI.refreshShortcuts()
                await MainActor.run { self?.refreshStrip() }
            }
        }
    }

    override func textDidChange(_ textInput: UITextInput?) {
        super.textDidChange(textInput)
        if card != nil && editingKey == nil { cardFollowsText() }
        updateAutoShift()
        buildKeys()
        refreshStrip()
    }

    // MARK: - Keys

    private func rows() -> [[String]] {
        switch page {
        case .letters:
            return [
                ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
                ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
                ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"],
                ["123", "🌐", "/", "space", "return"],
            ]
        case .numbers:
            return [
                ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
                ["-", "/", ":", ";", "(", ")", "₹", "&", "@", "\""],
                ["#+=", ".", ",", "?", "!", "'", "⌫"],
                ["ABC", "🌐", "\\", "space", "return"],
            ]
        case .symbols:
            return [
                ["[", "]", "{", "}", "#", "%", "^", "*", "+", "="],
                ["_", "\\", "|", "~", "<", ">", "$", "€", "£", "•"],
                ["123", ".", ",", "?", "!", "'", "⌫"],
                ["ABC", "🌐", "/", "space", "return"],
            ]
        }
    }

    private func buildKeys(force: Bool = false) {
        guard isViewLoaded else { return }
        let signature = "\(page)|\(shift)|\(returnTitle())|\(dark)|\(needsInputModeSwitchKey)"
        if !force && signature == keysSignature { return }
        keysSignature = signature
        keysStack.arrangedSubviews.forEach { $0.removeFromSuperview() }
        view.backgroundColor = .clear
        for (index, row) in rows().enumerated() {
            let rowStack = UIStackView()
            rowStack.isMultipleTouchEnabled = true
            rowStack.axis = .horizontal
            rowStack.spacing = 6
            rowStack.distribution = .fill
            var letterKeys: [UIView] = []
            let bottom = index == 3
            for title in row {
                if title == "🌐" && !needsInputModeSwitchKey { continue }
                let key = makeKey(title, bottomRow: bottom)
                rowStack.addArrangedSubview(key)
                if isCharacterKey(title, bottomRow: bottom) { letterKeys.append(key) }
            }
            // Character keys share one width; the rest take what is left (like Apple's layout).
            if let first = letterKeys.first {
                for other in letterKeys.dropFirst() {
                    other.widthAnchor.constraint(equalTo: first.widthAnchor).isActive = true
                }
            }
            if index == 1 && page == .letters {
                // The middle letter row is inset by half a key on both sides.
                let wrapper = UIStackView()
                wrapper.isMultipleTouchEnabled = true
                wrapper.axis = .horizontal
                let left = UIView(), right = UIView()
                wrapper.addArrangedSubview(left)
                wrapper.addArrangedSubview(rowStack)
                wrapper.addArrangedSubview(right)
                left.widthAnchor.constraint(equalTo: right.widthAnchor).isActive = true
                if let first = letterKeys.first {
                    left.widthAnchor.constraint(equalTo: first.widthAnchor, multiplier: 0.5).isActive = true
                }
                keysStack.addArrangedSubview(wrapper)
            } else {
                keysStack.addArrangedSubview(rowStack)
            }
            // Function keys in rows 3 and 4 get fixed proportions.
            for case let key as KeyButton in rowStack.arrangedSubviews {
                switch key.keyValue {
                case "⇧", "⌫", "#+=":
                    if let first = letterKeys.first { key.widthAnchor.constraint(equalTo: first.widthAnchor, multiplier: page == .letters ? 1.35 : 1.6).isActive = true }
                case "123", "ABC", "🌐":
                    key.widthAnchor.constraint(equalToConstant: 42).isActive = true
                case "/" where bottom, "\\" where bottom:
                    key.widthAnchor.constraint(equalToConstant: 42).isActive = true
                case "return":
                    key.widthAnchor.constraint(equalToConstant: 88).isActive = true
                default: break
                }
            }
        }
    }

    private func isCharacterKey(_ title: String, bottomRow: Bool) -> Bool {
        !bottomRow && !["⇧", "⌫", "123", "ABC", "#+=", "🌐", "space", "return"].contains(title)
    }

    private func makeKey(_ title: String, bottomRow: Bool) -> KeyButton {
        let key = KeyButton(type: .custom)
        key.keyValue = title
        key.layer.cornerRadius = 5
        key.layer.shadowColor = UIColor.black.cgColor
        key.layer.shadowOpacity = dark ? 0 : 0.3
        key.layer.shadowOffset = CGSize(width: 0, height: 1)
        key.layer.shadowRadius = 0
        key.setTitleColor(keyTextColor, for: .normal)
        let isFunction = !isCharacterKey(title, bottomRow: bottomRow) && title != "space"
        key.baseColor = isFunction ? functionKeyColor : letterKeyColor
        key.pressedColor = isFunction ? letterKeyColor : functionKeyColor
        key.backgroundColor = key.baseColor
        key.titleLabel?.font = .systemFont(ofSize: isFunction ? 16 : 23)

        switch title {
        case "⇧":
            let name = shift == .locked ? "capslock.fill" : (shift == .once ? "shift.fill" : "shift")
            key.setImage(UIImage(systemName: name), for: .normal)
            if shift != .off { key.baseColor = letterKeyColor; key.backgroundColor = letterKeyColor }
        case "⌫":
            key.setImage(UIImage(systemName: "delete.left"), for: .normal)
        case "🌐":
            key.setImage(UIImage(systemName: "globe"), for: .normal)
            key.addTarget(self, action: #selector(handleInputModeList(from:with:)), for: .allTouchEvents)
        case "space":
            key.setTitle("space", for: .normal)
            key.titleLabel?.font = .systemFont(ofSize: 16)
        case "return":
            key.setTitle(returnTitle(), for: .normal)
            key.titleLabel?.font = .systemFont(ofSize: 16)
        case "/" where bottomRow, "\\" where bottomRow:
            // The Ezyourlife key: starts a shortcut or app command.
            key.setTitle(title, for: .normal)
            key.setTitleColor(.white, for: .normal)
            key.baseColor = brand
            key.pressedColor = brand.withAlphaComponent(0.7)
            key.backgroundColor = brand
            key.titleLabel?.font = .boldSystemFont(ofSize: 20)
        default:
            let shown = (page == .letters && shift != .off) ? title.uppercased() : title
            key.setTitle(shown, for: .normal)
        }
        key.tintColor = keyTextColor
        if title != "🌐" {
            key.addTarget(self, action: #selector(keyDown(_:)), for: .touchDown)
            // A finger that drifts off the key before lifting still means that key (Apple's keyboard works the same way).
            key.addTarget(self, action: #selector(keyUp(_:)), for: [.touchUpInside, .touchUpOutside])
            key.addTarget(self, action: #selector(keyCancel(_:)), for: [.touchCancel])
        }
        return key
    }

    private func returnTitle() -> String {
        if editingKey != nil { return currentFieldIsList ? "new line" : "done" }
        switch textDocumentProxy.returnKeyType ?? .default {
        case .go: return "go"
        case .search, .google, .yahoo: return "search"
        case .send: return "send"
        case .done: return "done"
        case .next: return "next"
        case .join: return "join"
        default: return "return"
        }
    }

    // MARK: Key actions

    @objc private func keyDown(_ key: KeyButton) {
        key.backgroundColor = key.pressedColor
        UIDevice.current.playInputClick()
        if key.keyValue == "⌫" {
            deleteBackward()
            deleteRepeats = 0
            deleteTimer?.invalidate()
            deleteTimer = Timer.scheduledTimer(withTimeInterval: 0.45, repeats: false) { [weak self] _ in
                self?.deleteTimer = Timer.scheduledTimer(withTimeInterval: 0.08, repeats: true) { [weak self] _ in
                    guard let self else { return }
                    self.deleteRepeats += 1
                    // After a while, delete whole words, like Apple's keyboard.
                    if self.deleteRepeats > 15 { self.deleteWord() } else { self.deleteBackward() }
                }
            }
        }
    }

    @objc private func keyCancel(_ key: KeyButton) {
        key.backgroundColor = key.baseColor
        deleteTimer?.invalidate()
    }

    @objc private func keyUp(_ key: KeyButton) {
        key.backgroundColor = key.baseColor
        deleteTimer?.invalidate()
        switch key.keyValue {
        case "⌫":
            break
        case "⇧":
            let now = Date()
            if now.timeIntervalSince(lastShiftTap) < 0.35 { shift = .locked } else { shift = (shift == .off) ? .once : .off }
            lastShiftTap = now
            buildKeys()
        case "123":
            page = .numbers; buildKeys()
        case "#+=":
            page = .symbols; buildKeys()
        case "ABC":
            page = .letters; buildKeys()
        case "space":
            let now = Date()
            let before = contextBefore
            if now.timeIntervalSince(lastSpaceTap) < 0.4, before.hasSuffix(" "), let c = before.dropLast().last, c.isLetter || c.isNumber {
                removeOne()
                type(". ")
            } else {
                type(" ")
                if page != .letters { page = .letters }
            }
            lastSpaceTap = now
            afterTyping()
        case "return":
            if editingKey != nil && !currentFieldIsList {
                finishEditing()
            } else {
                type("\n")
                afterTyping()
            }
        default:
            var text = key.keyValue
            if page == .letters && shift != .off { text = text.uppercased() }
            type(text)
            if page == .letters && shift == .once { shift = .off }
            if page != .letters && (text == "'" ) { page = .letters }
            afterTyping()
        }
    }

    /// Where typing goes: into the box being edited on the details card, otherwise into the app's text box.
    private func type(_ text: String) {
        if let key = editingKey, card != nil {
            card!.values[key, default: ""] += text
            card!.edited.insert(key)
            card!.fromProfile.remove(key)
        } else {
            textDocumentProxy.insertText(text)
        }
    }

    private func removeOne() {
        if let key = editingKey, card != nil {
            var value = card!.values[key] ?? ""
            if !value.isEmpty { value.removeLast() }
            card!.values[key] = value
            card!.edited.insert(key)
            card!.fromProfile.remove(key)
        } else {
            textDocumentProxy.deleteBackward()
        }
    }

    private var contextBefore: String {
        if let key = editingKey, let card { return card.values[key] ?? "" }
        return textDocumentProxy.documentContextBeforeInput ?? ""
    }

    private func deleteBackward() {
        removeOne()
        afterTyping()
    }

    private func deleteWord() {
        let before = contextBefore
        var count = 0
        for ch in before.reversed() {
            if ch.isWhitespace && count > 0 { break }
            count += 1
        }
        for _ in 0..<max(count, 1) { removeOne() }
        afterTyping()
    }

    private func afterTyping() {
        updateAutoShift()
        buildKeys()
        refreshStrip()
    }

    private func updateAutoShift() {
        guard shift != .locked, page == .letters else { return }
        let type = editingKey != nil ? UITextAutocapitalizationType.sentences : (textDocumentProxy.autocapitalizationType ?? .sentences)
        if type == UITextAutocapitalizationType.none { shift = .off; return }
        if type == .allCharacters { shift = .once; return }
        let before = contextBefore
        let trimmed = before.trimmingCharacters(in: .whitespaces)
        if before.isEmpty || before.hasSuffix("\n") {
            shift = .once
        } else if type == .words && before.hasSuffix(" ") {
            shift = .once
        } else if before.hasSuffix(" "), let last = trimmed.last, ".?!".contains(last) {
            shift = .once
        } else {
            shift = .off
        }
    }

    // MARK: - The strip

    private func refreshStrip(force: Bool = false) {
        guard isViewLoaded else { return }
        applyMode()
        // Typing ordinary text changes nothing in the strip: skip the redraw.
        let command = card == nil ? EzyMatch.command(in: textDocumentProxy.documentContextBeforeInput)?.text : nil
        let editingValue = editingKey.flatMap { card?.values[$0] } ?? ""
        var parts: [String] = []
        parts.append(busy ?? "")
        parts.append(notice ?? "")
        parts.append(hasFullAccess ? "fa" : "")
        parts.append(EzyShared.isConnected ? "on" : "")
        parts.append(command ?? "∅")
        parts.append(appResults.map { $0.id }.joined(separator: ","))
        parts.append(suggestion?.text ?? "")
        if let card { parts.append(card.app.id + "|" + String(card.values.count)) }
        parts.append(editingKey ?? "")
        parts.append(editingValue)
        parts.append((EzyShared.lastResult?.isFresh ?? false) ? "last" : "")
        let signature = parts.joined(separator: "¦")
        if !force && signature == stripSignature { return }
        stripSignature = signature
        stripStack.arrangedSubviews.forEach { $0.removeFromSuperview() }

        if let busy {
            addChip(busy, style: .note)
            return
        }
        if let notice {
            addChip(notice, style: .note) { [weak self] in self?.notice = nil; self?.refreshStrip() }
            return
        }
        guard hasFullAccess else {
            addChip("For / shortcuts: Settings › EZYOURLIFE › Keyboards › Allow Full Access", style: .note)
            return
        }
        guard EzyShared.isConnected else {
            addChip("Open the EZYOURLIFE app › Keyboard and voice › Connect", style: .note)
            return
        }

        // The details card is open.
        if let card {
            if let key = editingKey, let field = card.fields.first(where: { $0.key == key }) {
                addChip("Done", style: .primary) { [weak self] in self?.finishEditing() }
                let value = card.values[key] ?? ""
                addChip("\(field.label): \(value.isEmpty ? (field.placeholder ?? "") : value)▏", style: .note, truncateHead: true)
                for option in field.options ?? [] {
                    addChip(option, style: .plain) { [weak self] in
                        self?.card?.values[key] = option
                        self?.card?.edited.insert(key)
                        self?.finishEditing()
                    }
                }
                if !value.isEmpty {
                    addChip("Clear", style: .plain) { [weak self] in
                        self?.card?.values[key] = ""
                        self?.card?.edited.insert(key)
                        self?.card?.fromProfile.remove(key)
                        self?.afterTyping()
                    }
                }
            } else {
                let price = card.app.priceLabel.isEmpty ? "" : " · \(card.app.priceLabel)"
                addChip("\(card.app.name)\(price)", style: .note)
                addChip("Tap a box to change it, or say more after the command", style: .note)
            }
            return
        }

        guard let command = EzyMatch.command(in: textDocumentProxy.documentContextBeforeInput) else {
            lastWordCount = 0
            suggestion = nil
            if let last = EzyShared.lastResult, last.isFresh {
                addChip("Insert: \(last.title)", style: .primary) { [weak self] in self?.insertLastResult(last) }
            }
            addChip("Type / for shortcuts and apps", style: .note)
            addChip("🎙 Voice", style: .plain) { [weak self] in
                self?.notice = "Type /, then tap the mic below and say what you need, like “proforma invoice for Rahul Traders”."
                self?.refreshStrip()
            }
            return
        }

        let words = command.text.split(separator: " ", omittingEmptySubsequences: true)
        let first = words.first.map(String.init) ?? ""
        let details = words.dropFirst().joined(separator: " ")
        // Several words arriving at once means dictation (or a paste): open the card by itself when it's ready.
        let jumped = words.count - lastWordCount >= 2
        lastWordCount = words.count

        // A sentence after "/": the best app, ready to check and run.
        if let suggestion, suggestion.text == command.text, let app = suggestion.plan.app {
            let price = app.priceLabel.isEmpty ? "" : " · \(app.priceLabel)"
            addChip("✨ \(app.name)\(price)", style: .primary) { [weak self] in
                self?.openCard(suggestion.plan, text: command.text)
            }
        }

        // Shortcuts first (instant, from the saved copy), then apps (searched online).
        let shortcutHits = EzyMatch.shortcuts(EzyShared.shortcuts, for: first)
        for s in shortcutHits {
            let preview = s.value.replacingOccurrences(of: "\n", with: " ").prefix(28)
            addChip("\(s.key) · \(preview)", style: .shortcut) { [weak self] in
                self?.replaceCommand(with: s.value)
            }
        }
        let apps = first.isEmpty ? EzyShared.recentApps : appResults
        for app in apps.prefix(6) where app.id != suggestion?.plan.app?.id {
            let price = app.priceLabel.isEmpty ? "" : " · \(app.priceLabel)"
            addChip("\(app.name)\(price)", style: .app) { [weak self] in
                guard let self else { return }
                if app.runnable == false {
                    self.replaceCommand(with: app.link)
                } else {
                    self.prepare(app: app, text: details.isEmpty ? app.name : details)
                }
            }
        }
        if shortcutHits.isEmpty && apps.isEmpty && suggestion == nil {
            addChip(first.isEmpty ? "Type a shortcut or an app name" : "Searching…", style: .note)
        }
        search(first)
        if words.count >= 2 && !shortcutHits.contains(where: { $0.key.lowercased() == command.text.lowercased() }) {
            planSoon(command.text, open: jumped)
        }
    }

    private func search(_ word: String) {
        guard word.count >= 2, word != lastQuery else { return }
        lastQuery = word
        searchTask?.cancel()
        searchTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 250_000_000)
            if Task.isCancelled { return }
            let found = (try? await EzyAPI.searchApps(word)) ?? []
            await MainActor.run {
                guard let self, self.lastQuery == word else { return }
                self.appResults = found
                self.refreshStrip()
            }
        }
    }

    /// Works out the app for the words after "/" once the person pauses (free; nothing runs).
    private func planSoon(_ text: String, open: Bool) {
        guard text != plannedText else { return }
        plannedText = text
        planTask?.cancel()
        planTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: open ? 300_000_000 : 1_000_000_000)
            if Task.isCancelled { return }
            guard let plan = try? await EzyAPI.plan(text), plan.app != nil else { return }
            await MainActor.run {
                guard let self, self.card == nil,
                      EzyMatch.command(in: self.textDocumentProxy.documentContextBeforeInput)?.text == text else { return }
                self.suggestion = (text, plan)
                if open { self.openCard(plan, text: text) } else { self.refreshStrip() }
            }
        }
    }

    /// An app chip was tapped: open its card with what is already known.
    private func prepare(app: EzyApp, text: String) {
        busy = "Getting \(app.name) ready…"
        refreshStrip()
        let command = EzyMatch.command(in: textDocumentProxy.documentContextBeforeInput)?.text ?? text
        Task { [weak self] in
            do {
                let plan = try await EzyAPI.plan(text, appId: app.id)
                await MainActor.run {
                    self?.busy = nil
                    self?.openCard(plan, text: command)
                }
            } catch {
                await MainActor.run {
                    self?.busy = nil
                    self?.notice = error.localizedDescription
                    self?.refreshStrip()
                }
            }
        }
    }

    private func openCard(_ plan: EzyPlan, text: String) {
        guard let app = plan.app else { return }
        var fields = plan.fields ?? []
        var values = plan.inputs ?? [:]
        if fields.isEmpty {
            // Apps without boxes take one request.
            fields = [EzyField(key: Self.promptKey, label: "What to make", type: "text", required: true, placeholder: nil, options: nil)]
            values[Self.promptKey] = plan.prompt ?? text
        }
        for field in fields where (values[field.key] ?? "").isEmpty {
            if let d = field.defaultValue, !d.isEmpty { values[field.key] = d }
        }
        planTask?.cancel()
        suggestion = nil
        editingKey = nil
        card = Card(plan: plan, app: app, fields: fields, values: values, fromProfile: Set(plan.fromProfile ?? []), commandText: text)
        page = .letters
        afterTyping()
    }

    private func closeCard() {
        card = nil
        editingKey = nil
        plannedText = ""
        afterTyping()
    }

    private func finishEditing() {
        editingKey = nil
        page = .letters
        afterTyping()
    }

    private var currentFieldIsList: Bool {
        guard let key = editingKey, let field = card?.fields.first(where: { $0.key == key }) else { return false }
        return field.type == "rows" || field.type == "textarea" || field.type == "longtext"
    }

    /// The person said or typed more after the command while the card is open: fill the boxes they haven't touched.
    private func cardFollowsText() {
        guard let current = card else { return }
        guard let command = EzyMatch.command(in: textDocumentProxy.documentContextBeforeInput) else {
            // The message was sent or the command deleted.
            card = nil
            return
        }
        guard command.text != current.commandText else { return }
        card?.commandText = command.text
        let appId = current.app.id
        planTask?.cancel()
        planTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 600_000_000)
            if Task.isCancelled { return }
            guard let plan = try? await EzyAPI.plan(command.text, appId: appId) else { return }
            await MainActor.run {
                guard let self, var card = self.card, card.app.id == appId else { return }
                for (key, value) in plan.inputs ?? [:] where !card.edited.contains(key) && !value.isEmpty {
                    if card.values[key] != value {
                        card.values[key] = value
                        if (plan.fromProfile ?? []).contains(key) { card.fromProfile.insert(key) } else { card.fromProfile.remove(key) }
                    }
                }
                if card.fields.first?.key == Self.promptKey, !card.edited.contains(Self.promptKey) {
                    card.values[Self.promptKey] = plan.prompt ?? command.text
                }
                self.card = card
                self.afterTyping()
            }
        }
    }

    private func generate() {
        guard let current = card else { return }
        let empty: (EzyField) -> Bool = { ($0.required ?? false) && (current.values[$0.key] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        if let missing = current.fields.first(where: empty) {
            editingKey = missing.key
            afterTyping()
            return
        }
        var plan = current.plan
        if current.fields.first?.key == Self.promptKey {
            plan.prompt = current.values[Self.promptKey]
            plan.inputs = nil
        } else {
            plan.inputs = current.values.filter { !$0.value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        }
        card = nil
        editingKey = nil
        busy = "Making your \(current.app.name)…"
        afterTyping()
        if current.app.mode == "device" {
            runOnDevice(current.app, values: current.values)
            return
        }
        Task { [weak self] in
            do {
                let result = try await EzyAPI.run(plan)
                if result.imageURL != nil { await EzyClipboard.copy(result) }
                await MainActor.run {
                    guard let self else { return }
                    self.busy = nil
                    self.replaceCommand(with: result.text)
                    self.notice = result.imageURL != nil
                        ? "Image copied. Tap and hold the message box, then Paste."
                        : "✓ \(current.app.name) is in. Tap to close."
                    self.refreshStrip()
                }
            } catch {
                await MainActor.run {
                    self?.busy = nil
                    self?.notice = error.localizedDescription
                    self?.refreshStrip()
                }
            }
        }
    }

    /// Photo tools: the work happens on the phone, the server only charges the run.
    private func runOnDevice(_ app: EzyApp, values: [String: String]) {
        Task { [weak self] in
            do {
                let output = try await EzyPhoto.run(app.id, values: values)
                try await EzyAPI.chargeDevice(app.id)
                await MainActor.run {
                    guard let self else { return }
                    self.busy = nil
                    switch output {
                    case let .image(data, type):
                        UIPasteboard.general.setData(data, forPasteboardType: type)
                        self.replaceCommand(with: "")
                        self.notice = type == "com.adobe.pdf"
                            ? "PDF copied. Tap and hold the message box, then Paste."
                            : "Image copied. Tap and hold the message box, then Paste."
                    case let .text(text):
                        self.replaceCommand(with: text)
                        self.notice = "✓ \(app.name) is in. Tap to close."
                    }
                    self.refreshStrip()
                }
            } catch {
                await MainActor.run {
                    self?.busy = nil
                    self?.notice = error.localizedDescription
                    self?.refreshStrip()
                }
            }
        }
    }

    /// Replaces "/command…" (everything from the slash to the cursor) with the text.
    private func replaceCommand(with text: String) {
        let length = EzyMatch.command(in: textDocumentProxy.documentContextBeforeInput)?.length ?? 0
        for _ in 0..<length { textDocumentProxy.deleteBackward() }
        textDocumentProxy.insertText(text)
        plannedText = ""
        suggestion = nil
        lastWordCount = 0
        afterTyping()
    }

    private func insertLastResult(_ result: EzyResult) {
        if result.imageURL != nil {
            Task { await EzyClipboard.copy(result) }
            notice = "Image copied. Tap and hold the message box, then Paste."
        }
        if !result.text.isEmpty { textDocumentProxy.insertText(result.text) }
        EzyShared.lastResult = nil
        afterTyping()
    }

    // MARK: The details card

    private func applyMode() {
        let showCard = card != nil && editingKey == nil
        cardView.isHidden = !showCard
        keysStack.isHidden = showCard
        heightConstraint?.constant = showCard ? 320 : 270
        if showCard { renderCard() }
    }

    private func renderCard() {
        cardView.subviews.forEach { $0.removeFromSuperview() }
        guard let card else { return }

        let scroll = UIScrollView()
        scroll.translatesAutoresizingMaskIntoConstraints = false
        let list = UIStackView()
        list.axis = .vertical
        list.spacing = 6
        list.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(list)

        for field in card.fields {
            list.addArrangedSubview(fieldRow(field, card: card))
        }

        let cancel = ChipButton(type: .system)
        cancel.setTitle("Cancel", for: .normal)
        cancel.titleLabel?.font = .systemFont(ofSize: 16)
        cancel.setTitleColor(keyTextColor, for: .normal)
        cancel.backgroundColor = functionKeyColor
        cancel.layer.cornerRadius = 8
        cancel.handler = { [weak self] in self?.closeCard() }
        cancel.addTarget(cancel, action: #selector(ChipButton.tapped), for: .touchUpInside)

        let go = ChipButton(type: .system)
        let price = card.app.priceLabel.isEmpty ? "" : " · \(card.app.priceLabel)"
        go.setTitle("✨ Generate\(price)", for: .normal)
        go.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        go.setTitleColor(.white, for: .normal)
        go.backgroundColor = brand
        go.layer.cornerRadius = 8
        go.handler = { [weak self] in self?.generate() }
        go.addTarget(go, action: #selector(ChipButton.tapped), for: .touchUpInside)

        let bar = UIStackView(arrangedSubviews: [cancel, go])
        bar.axis = .horizontal
        bar.spacing = 8
        bar.translatesAutoresizingMaskIntoConstraints = false
        cancel.widthAnchor.constraint(equalToConstant: 92).isActive = true

        cardView.addSubview(scroll)
        cardView.addSubview(bar)
        NSLayoutConstraint.activate([
            scroll.topAnchor.constraint(equalTo: cardView.topAnchor),
            scroll.leadingAnchor.constraint(equalTo: cardView.leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: cardView.trailingAnchor),
            scroll.bottomAnchor.constraint(equalTo: bar.topAnchor, constant: -6),

            list.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor),
            list.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor),
            list.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor),
            list.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor),
            list.widthAnchor.constraint(equalTo: scroll.frameLayoutGuide.widthAnchor),

            bar.leadingAnchor.constraint(equalTo: cardView.leadingAnchor),
            bar.trailingAnchor.constraint(equalTo: cardView.trailingAnchor),
            bar.bottomAnchor.constraint(equalTo: cardView.bottomAnchor),
            bar.heightAnchor.constraint(equalToConstant: 46),
        ])
    }

    /// Photo boxes (ProductVision 360): a keyboard can't open the photo library, so it uses a copied photo.
    private func takeCopiedPhoto(for key: String) {
        // Read the copied file and shrink it while decoding: a full photo decoded at once would use
        // more memory than iOS allows a keyboard.
        let board = UIPasteboard.general
        let types = ["public.jpeg", "public.png", "public.heic", "public.heif", "public.image"]
        let raw = types.lazy.compactMap { board.data(forPasteboardType: $0) }.first
        var small: UIImage?
        if let raw, let source = CGImageSourceCreateWithData(raw as CFData, nil) {
            let options: [CFString: Any] = [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: 1600,
            ]
            if let cg = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) { small = UIImage(cgImage: cg) }
        }
        guard let resized = small else {
            notice = "No photo copied. In Photos, tap Share › Copy, then come back and tap the box again."
            afterTyping()
            return
        }
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let flat = UIGraphicsImageRenderer(size: resized.size, format: format).image { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: resized.size))
            resized.draw(at: .zero)
        }
        guard let data = flat.jpegData(compressionQuality: 0.9) else { return }
        card?.values[key] = "data:image/jpeg;base64," + data.base64EncodedString()
        card?.edited.insert(key)
        afterTyping()
    }

    /// PDF tools read the PDF the person copied (Files › Share › Copy).
    private func takeCopiedPDF(for key: String) {
        guard let data = UIPasteboard.general.data(forPasteboardType: "com.adobe.pdf"), PDFDocument(data: data) != nil else {
            notice = "No PDF copied. In Files, tap and hold the PDF, tap Share › Copy, then tap the box again."
            afterTyping()
            return
        }
        guard data.count <= 15_000_000 else {
            notice = "That PDF is over 15 MB, too big for the keyboard. Use ezyourlife.com for it."
            afterTyping()
            return
        }
        card?.values[key] = "data:application/pdf;base64," + data.base64EncodedString()
        card?.edited.insert(key)
        afterTyping()
    }

    private func fieldRow(_ field: EzyField, card: Card) -> UIView {
        let value = (card.values[field.key] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let required = field.required ?? false
        let muted = dark ? UIColor(white: 0.75, alpha: 1) : UIColor(white: 0.35, alpha: 1)

        let title = NSMutableAttributedString(string: field.label, attributes: [.font: UIFont.systemFont(ofSize: 12), .foregroundColor: muted])
        if card.fromProfile.contains(field.key) {
            title.append(NSAttributedString(string: "  · from your profile", attributes: [.font: UIFont.systemFont(ofSize: 12), .foregroundColor: brand]))
        }
        title.append(NSAttributedString(string: "\n"))
        if field.type == "pdf" {
            let shown = value.isEmpty ? "Copy a PDF, then tap here" : "📄 PDF added (tap to use the one you copied now)"
            title.append(NSAttributedString(string: shown, attributes: [.font: UIFont.systemFont(ofSize: 15, weight: value.isEmpty ? .semibold : .regular), .foregroundColor: value.isEmpty ? brand : keyTextColor]))
        } else if field.type == "image" {
            let shown = value.isEmpty ? "Copy a photo, then tap here" : "📷 Photo added (tap to use the one you copied now)"
            title.append(NSAttributedString(string: shown, attributes: [.font: UIFont.systemFont(ofSize: 15, weight: value.isEmpty ? .semibold : .regular), .foregroundColor: value.isEmpty ? brand : keyTextColor]))
        } else if value.isEmpty {
            let hint = required ? "Tap to add" : (field.placeholder.map { "Optional, e.g. \($0)" } ?? "Optional")
            title.append(NSAttributedString(string: hint, attributes: [.font: UIFont.systemFont(ofSize: 15, weight: required ? .semibold : .regular), .foregroundColor: required ? brand : muted]))
        } else {
            title.append(NSAttributedString(string: value, attributes: [.font: UIFont.systemFont(ofSize: 15), .foregroundColor: keyTextColor]))
        }

        let row = ChipButton(type: .custom)
        row.setAttributedTitle(title, for: .normal)
        row.titleLabel?.numberOfLines = 3
        row.titleLabel?.lineBreakMode = .byTruncatingTail
        row.contentHorizontalAlignment = .leading
        row.contentEdgeInsets = UIEdgeInsets(top: 7, left: 12, bottom: 7, right: 12)
        row.backgroundColor = chipColor
        row.layer.cornerRadius = 8
        if required && value.isEmpty {
            row.layer.borderWidth = 1
            row.layer.borderColor = brand.cgColor
        }
        row.handler = { [weak self] in
            if field.type == "image" {
                self?.takeCopiedPhoto(for: field.key)
                return
            }
            if field.type == "pdf" {
                self?.takeCopiedPDF(for: field.key)
                return
            }
            self?.editingKey = field.key
            self?.page = field.type == "number" || field.type == "money" ? .numbers : .letters
            self?.afterTyping()
        }
        row.addTarget(row, action: #selector(ChipButton.tapped), for: .touchUpInside)
        return row
    }

    // MARK: Chips

    private enum ChipStyle { case primary, shortcut, app, plain, note }

    private func addChip(_ title: String, style: ChipStyle, truncateHead: Bool = false, action: (() -> Void)? = nil) {
        let chip = ChipButton(type: .system)
        chip.setTitle(title, for: .normal)
        chip.titleLabel?.font = .systemFont(ofSize: 15, weight: style == .primary ? .semibold : .regular)
        chip.titleLabel?.lineBreakMode = truncateHead ? .byTruncatingHead : .byTruncatingTail
        chip.contentEdgeInsets = UIEdgeInsets(top: 6, left: 12, bottom: 6, right: 12)
        chip.layer.cornerRadius = 15
        switch style {
        case .primary:
            chip.backgroundColor = brand
            chip.setTitleColor(.white, for: .normal)
        case .shortcut, .app, .plain:
            chip.backgroundColor = chipColor
            chip.setTitleColor(keyTextColor, for: .normal)
            if style == .app {
                chip.layer.borderWidth = 1
                chip.layer.borderColor = brand.cgColor
            }
        case .note:
            chip.backgroundColor = .clear
            chip.setTitleColor(dark ? UIColor(white: 0.8, alpha: 1) : UIColor(white: 0.25, alpha: 1), for: .normal)
            chip.titleLabel?.font = .systemFont(ofSize: 13)
        }
        chip.widthAnchor.constraint(lessThanOrEqualToConstant: 280).isActive = true
        chip.handler = action
        chip.isUserInteractionEnabled = action != nil
        chip.addTarget(chip, action: #selector(ChipButton.tapped), for: .touchUpInside)
        stripStack.addArrangedSubview(chip)
    }
}

// MARK: - Small views

/// The keys area. A touch that lands in the gap between keys goes to the nearest key,
/// so no tap is lost (Apple's keyboard has no dead space either).
final class KeysStack: UIStackView {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let hit = super.hitTest(point, with: event)
        if hit is KeyButton || isHidden || !self.point(inside: point, with: event) { return hit }
        var best: (KeyButton, CGFloat)?
        func visit(_ view: UIView) {
            for sub in view.subviews where !sub.isHidden {
                if let key = sub as? KeyButton {
                    let frame = key.convert(key.bounds, to: self)
                    let dx = max(frame.minX - point.x, 0, point.x - frame.maxX)
                    let dy = max(frame.minY - point.y, 0, point.y - frame.maxY)
                    let d = dx * dx + dy * dy
                    if best == nil || d < best!.1 { best = (key, d) }
                } else {
                    visit(sub)
                }
            }
        }
        visit(self)
        return best?.0 ?? hit
    }
}

final class KeyButton: UIButton {
    var keyValue = ""
    var baseColor: UIColor = .white
    var pressedColor: UIColor = .lightGray
}

final class ChipButton: UIButton {
    var handler: (() -> Void)?
    @objc func tapped() {
        UIDevice.current.playInputClick()
        handler?()
    }
}

/// Lets the keys make the standard keyboard click (when Keyboard Clicks is on in Settings).
final class KeyboardInputView: UIInputView, UIInputViewAudioFeedback {
    var enableInputClicksWhenVisible: Bool { true }
}

// MARK: - Photo tools that run on the phone

/*
 * The website's photo tools (resize, file size in KB, exam and passport photos, signatures, crops, blurs,
 * background removal, metadata…) run here, on the phone, from a copied photo. Nothing is uploaded; the
 * server only charges the website price (POST /v1/apps/{id}/charge). Boxes for each tool come from
 * supabase/functions/_shared/nativeApis.ts (DEVICE_APPS). Images are kept small enough for a keyboard's
 * memory limit (about 2400 px at most).
 */
enum EzyPhotoOutput {
    case image(Data, type: String)
    case text(String)
}

enum EzyPhotoError: LocalizedError {
    case noPhoto, failed(String)
    var errorDescription: String? {
        switch self {
        case .noPhoto: return "Copy a photo first (Photos › Share › Copy), then tap the photo box."
        case .failed(let why): return why
        }
    }
}

enum EzyPhoto {
    private static let context = CIContext(options: [.cacheIntermediates: false])

    /// Fixed sizes: (width, height, unit, fit without cropping, file size range in KB).
    private static let presets: [String: (Double, Double, String, Bool, ClosedRange<Double>?)] = [
        "resize-image-3.5x4.5": (3.5, 4.5, "cm", false, nil),
        "resize-600x600": (600, 600, "px", false, nil),
        "resize-a4": (21, 29.7, "cm150", true, nil),
        "resize-sign-6x2": (6, 2, "cm", true, nil),
        "resize-signature-50x20": (50, 20, "mm", true, nil),
        "resize-35x45mm": (35, 45, "mm", false, nil),
        "resize-2x2-inch": (2, 2, "inch", false, nil),
        "resize-3x4-inch": (3, 4, "inch", false, nil),
        "resize-4x6-inch": (4, 6, "inch", false, nil),
        "ssc-photo-resize": (3.5, 4.5, "cm", false, 20...50),
        "pan-card-resize": (2.5, 3.5, "cm", false, 10...50),
        "upsc-photo-resize": (3.5, 4.5, "cm", false, 20...300),
        "psc-photo-resize": (3.5, 4.5, "cm", false, 20...100),
        "whatsapp-dp": (500, 500, "px", true, nil),
        "instagram-resize": (1080, 1080, "px", true, nil),
        "youtube-banner": (2560, 1440, "px", false, nil),
    ]

    static func run(_ id: String, values: [String: String]) async throws -> EzyPhotoOutput {
        try await Task.detached(priority: .userInitiated) { try work(id, values) }.value
    }

    private static func work(_ id: String, _ v: [String: String]) throws -> EzyPhotoOutput {
        switch id {
        case "generate-signature":
            return try signature(v["name"] ?? "")
        case "view-metadata", "check-dpi":
            return .text(try metadata(detailed: id == "view-metadata"))
        case "remove-metadata":
            return try stripMetadata(v)
        case "pdf-to-text", "pdf-to-jpg", "rotate-pdf", "split-pdf", "merge-pdf":
            return try pdfTool(id, v)
        default:
            break
        }
        let input = try photo(v)

        if let p = presets[id] {
            var kbRange = p.4
            if let custom = v["kb"], let r = range(custom) { kbRange = r }
            let dpi: Double = p.2 == "cm150" ? 150 : 300
            let size = pixels(p.0, p.1, p.2 == "cm150" ? "cm" : p.2, dpi: dpi)
            let out = p.3 ? fit(input, size, blurredBackground: p.2 == "px") : fill(input, size, faceAware: id.contains("photo") || id.hasPrefix("resize-") && !id.contains("sign"))
            return .image(try jpeg(out, dpi: dpi, kb: kbRange), type: "public.jpeg")
        }

        switch id {
        case "passport-photo-maker":
            return .image(try jpeg(fill(input, pixels(35, 45, "mm", dpi: 300), faceAware: true), dpi: 300, kb: nil), type: "public.jpeg")
        case "resize-image-pixel", "resize-image-cm", "resize-image-mm", "resize-image-inch", "resize-signature":
            let unit = v["unit"] ?? (id == "resize-image-pixel" ? "px" : id == "resize-image-mm" ? "mm" : id == "resize-image-inch" ? "inch" : "cm")
            let w = Double(v["width"] ?? "") ?? 0, h = Double(v["height"] ?? "") ?? 0
            guard w > 0, h > 0 else { throw EzyPhotoError.failed("Add the width and height.") }
            let size = pixels(w, h, unit, dpi: 300)
            guard size.width <= 4000, size.height <= 4000 else { throw EzyPhotoError.failed("That size is too big for the keyboard. Use the website for very large sizes.") }
            let out = id == "resize-signature" ? fit(input, size, blurredBackground: false) : fill(input, size, faceAware: false)
            return .image(try jpeg(out, dpi: 300, kb: nil), type: "public.jpeg")
        case "reduce-image-size-kb", "increase-image-size-kb":
            let target = Double(v["kb"] ?? "") ?? 50
            let r: ClosedRange<Double> = id == "reduce-image-size-kb" ? max(1, target * 0.85)...target : target...(target * 1.15)
            return .image(try jpeg(input, dpi: nil, kb: r), type: "public.jpeg")
        case "rotate-image":
            let a = v["angle"] ?? "90° right"
            let o: CGImagePropertyOrientation = a.hasPrefix("180") ? .down : a.contains("left") ? .left : .right
            return .image(try jpeg(input.oriented(o), dpi: nil, kb: nil), type: "public.jpeg")
        case "flip-image":
            let o: CGImagePropertyOrientation = (v["direction"] ?? "").hasPrefix("Top") ? .downMirrored : .upMirrored
            return .image(try jpeg(input.oriented(o), dpi: nil, kb: nil), type: "public.jpeg")
        case "grayscale-image":
            return .image(try jpeg(input.applyingFilter("CIPhotoEffectMono"), dpi: nil, kb: nil), type: "public.jpeg")
        case "black-white":
            let gray = input.applyingFilter("CIColorControls", parameters: [kCIInputSaturationKey: 0, kCIInputContrastKey: 1.6])
            return .image(try jpeg(gray.applyingFilter("CIColorThreshold", parameters: ["inputThreshold": 0.55]), dpi: nil, kb: nil), type: "public.jpeg")
        case "blur-image":
            let r: Double = (v["strength"] ?? "") == "Light" ? 4 : (v["strength"] ?? "") == "Strong" ? 22 : 10
            return .image(try jpeg(input.clampedToExtent().applyingGaussianBlur(sigma: r).cropped(to: input.extent), dpi: nil, kb: nil), type: "public.jpeg")
        case "motion-blur":
            let out = input.clampedToExtent().applyingFilter("CIMotionBlur", parameters: [kCIInputRadiusKey: 20, kCIInputAngleKey: 0]).cropped(to: input.extent)
            return .image(try jpeg(out, dpi: nil, kb: nil), type: "public.jpeg")
        case "pixelate-image":
            return .image(try jpeg(pixelate(input, blocks: 60), dpi: nil, kb: nil), type: "public.jpeg")
        case "picture-pixel-art":
            let art = pixelate(input, blocks: 48).applyingFilter("CIColorPosterize", parameters: ["inputLevels": 6])
            return .image(try png(art), type: "public.png")
        case "beautify-image":
            return .image(try jpeg(autoAdjust(input), dpi: nil, kb: nil), type: "public.jpeg")
        case "ai-photo-enhancer", "increase-image-quality", "unblur-image":
            return .image(try jpeg(sharpen(autoAdjust(input), amount: id == "unblur-image" ? 1.1 : 0.6), dpi: nil, kb: nil), type: "public.jpeg")
        case "super-resolution", "upscale-image-ai":
            let scale = min(2, 3200 / max(input.extent.width, input.extent.height))
            let up = input.applyingFilter("CILanczosScaleTransform", parameters: [kCIInputScaleKey: scale, kCIInputAspectRatioKey: 1])
            return .image(try jpeg(sharpen(up, amount: 0.5), dpi: nil, kb: nil), type: "public.jpeg")
        case "square-crop":
            let side = min(input.extent.width, input.extent.height)
            return .image(try jpeg(fill(input, CGSize(width: side, height: side), faceAware: false), dpi: nil, kb: nil), type: "public.jpeg")
        case "circle-crop":
            let side = min(input.extent.width, input.extent.height)
            let square = fill(input, CGSize(width: side, height: side), faceAware: false)
            let mask = CIFilter(name: "CIRadialGradient", parameters: [
                "inputCenter": CIVector(x: side / 2, y: side / 2), "inputRadius0": side / 2 - 1, "inputRadius1": side / 2,
                "inputColor0": CIColor.white, "inputColor1": CIColor(red: 0, green: 0, blue: 0, alpha: 0),
            ])!.outputImage!.cropped(to: square.extent)
            let clear = CIImage(color: .clear).cropped(to: square.extent)
            return .image(try png(square.applyingFilter("CIBlendWithAlphaMask", parameters: [kCIInputBackgroundImageKey: clear, kCIInputMaskImageKey: mask])), type: "public.png")
        case "zoom-out-image":
            let side = max(input.extent.width, input.extent.height)
            return .image(try jpeg(fit(input, CGSize(width: side, height: side), blurredBackground: true), dpi: nil, kb: nil), type: "public.jpeg")
        case "remove-background":
            guard let mask = try subjectMask(input) else { throw EzyPhotoError.failed("Couldn't find a person or object to keep.") }
            let clear = CIImage(color: .clear).cropped(to: input.extent)
            return .image(try png(input.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: clear, kCIInputMaskImageKey: mask])), type: "public.png")
        case "blur-background":
            guard let mask = try subjectMask(input) else { throw EzyPhotoError.failed("Couldn't find a person or object to keep sharp.") }
            let blurred = input.clampedToExtent().applyingGaussianBlur(sigma: 14).cropped(to: input.extent)
            return .image(try jpeg(input.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: blurred, kCIInputMaskImageKey: mask]), dpi: nil, kb: nil), type: "public.jpeg")
        case "blur-face", "pixelate-face", "censor-photo":
            let faces = try faceRects(input)
            guard !faces.isEmpty else { throw EzyPhotoError.failed("No face found in this photo.") }
            var out = input
            for r in faces {
                let box = r.insetBy(dx: -r.width * 0.15, dy: -r.height * 0.2).intersection(input.extent)
                let patch: CIImage
                switch id {
                case "blur-face": patch = input.clampedToExtent().applyingGaussianBlur(sigma: max(8, box.width / 10)).cropped(to: box)
                case "pixelate-face": patch = input.applyingFilter("CIPixellate", parameters: [kCIInputScaleKey: max(8, box.width / 10), kCIInputCenterKey: CIVector(x: box.midX, y: box.midY)]).cropped(to: box)
                default:
                    let bar = CGRect(x: box.minX, y: box.minY + box.height * 0.45, width: box.width, height: box.height * 0.22)
                    patch = CIImage(color: .black).cropped(to: bar)
                }
                out = patch.composited(over: out)
            }
            return .image(try jpeg(out, dpi: nil, kb: nil), type: "public.jpeg")
        case "watermark-images", "add-text-image", "add-name-dob-photo":
            return .image(try overlay(id, input, v), type: "public.jpeg")
        case "convert-dpi":
            let dpi = Double(v["dpi"] ?? "") ?? 300
            return .image(try jpeg(input, dpi: dpi, kb: nil), type: "public.jpeg")
        case "image-color-picker":
            return .text(try colours(input))
        case "merge-photo-signature", "join-images", "add-logo":
            return .image(try twoPictures(id, input, try photo(v, "photo2"), v), type: "public.jpeg")
        case "heic-to-jpg", "webp-to-jpg", "png-to-jpg":
            return .image(try jpeg(input, dpi: nil, kb: nil), type: "public.jpeg")
        case "jpg-to-pdf":
            return .image(try imagePDF(input, a4: (v["pageSize"] ?? "A4") == "A4"), type: "com.adobe.pdf")
        default:
            throw EzyPhotoError.failed("This tool isn't on the keyboard yet. Open it on ezyourlife.com.")
        }
    }

    // MARK: Two pictures

    private static func scaled(_ image: CIImage, by k: CGFloat) -> CIImage {
        image.applyingFilter("CILanczosScaleTransform", parameters: [kCIInputScaleKey: k, kCIInputAspectRatioKey: 1])
    }

    private static func twoPictures(_ id: String, _ a: CIImage, _ b: CIImage, _ v: [String: String]) throws -> Data {
        let white = CIImage(color: .white)
        switch id {
        case "add-logo":
            let side = min(a.extent.width, a.extent.height)
            let logo = scaled(b, by: side * 0.2 / max(b.extent.width, b.extent.height))
            let pad = side * 0.03
            let c = v["corner"] ?? "Bottom right"
            let x = c.hasSuffix("left") ? pad : a.extent.width - logo.extent.width - pad
            let y = c.hasPrefix("Top") ? a.extent.height - logo.extent.height - pad : pad
            let placed = logo.transformed(by: CGAffineTransform(translationX: x - logo.extent.minX, y: y - logo.extent.minY))
            return try jpeg(placed.composited(over: a), dpi: nil, kb: nil)
        case "merge-photo-signature":
            // Photo on top, signature underneath, same width, on white.
            let width = min(a.extent.width, 1200)
            let top = scaled(a, by: width / a.extent.width)
            let sign = scaled(b, by: width / b.extent.width)
            let cropTop = top.transformed(by: CGAffineTransform(translationX: -top.extent.minX, y: sign.extent.height - top.extent.minY))
            let cropSign = sign.transformed(by: CGAffineTransform(translationX: -sign.extent.minX, y: -sign.extent.minY))
            let canvas = CGRect(x: 0, y: 0, width: width, height: cropTop.extent.maxY)
            return try jpeg(cropTop.composited(over: cropSign.composited(over: white)).cropped(to: canvas), dpi: 300, kb: nil)
        default: // join-images
            let beside = (v["layout"] ?? "Side by side") == "Side by side"
            if beside {
                let h = min(a.extent.height, b.extent.height, 1600)
                let l = scaled(a, by: h / a.extent.height), r = scaled(b, by: h / b.extent.height)
                let left = l.transformed(by: CGAffineTransform(translationX: -l.extent.minX, y: -l.extent.minY))
                let right = r.transformed(by: CGAffineTransform(translationX: left.extent.width - r.extent.minX, y: -r.extent.minY))
                let canvas = CGRect(x: 0, y: 0, width: right.extent.maxX, height: max(left.extent.height, right.extent.height))
                return try jpeg(right.composited(over: left.composited(over: white)).cropped(to: canvas), dpi: nil, kb: nil)
            }
            let w = min(a.extent.width, b.extent.width, 1600)
            let t = scaled(a, by: w / a.extent.width), u = scaled(b, by: w / b.extent.width)
            let lower = u.transformed(by: CGAffineTransform(translationX: -u.extent.minX, y: -u.extent.minY))
            let upper = t.transformed(by: CGAffineTransform(translationX: -t.extent.minX, y: lower.extent.height - t.extent.minY))
            let canvas = CGRect(x: 0, y: 0, width: max(upper.extent.width, lower.extent.width), height: upper.extent.maxY)
            return try jpeg(upper.composited(over: lower.composited(over: white)).cropped(to: canvas), dpi: nil, kb: nil)
        }
    }

    // MARK: PDFs

    private static func pdf(_ v: [String: String], _ key: String = "pdf") throws -> PDFDocument {
        guard let url = v[key], let comma = url.firstIndex(of: ","),
              let data = Data(base64Encoded: String(url[url.index(after: comma)...])),
              let doc = PDFDocument(data: data) else { throw EzyPhotoError.failed("Copy a PDF first, then tap the PDF box.") }
        if doc.isLocked { throw EzyPhotoError.failed("This PDF has a password. Open it on ezyourlife.com instead.") }
        return doc
    }

    /// "1-3, 5, 8-" → zero-based page indexes, in order, within the page count.
    private static func pageList(_ s: String, count: Int) -> [Int] {
        var out: [Int] = []
        for part in s.split(separator: ",") {
            let bits = part.split(separator: "-", omittingEmptySubsequences: false).map { Int($0.trimmingCharacters(in: .whitespaces)) }
            guard let first = bits.first else { continue }
            let lo = first ?? 1
            let hi = bits.count > 1 ? (bits[1] ?? count) : lo
            if lo > hi { continue }
            for n in lo...hi where n >= 1 && n <= count && !out.contains(n - 1) { out.append(n - 1) }
        }
        return out
    }

    private static func pdfTool(_ id: String, _ v: [String: String]) throws -> EzyPhotoOutput {
        let doc = try pdf(v)
        guard doc.pageCount > 0 else { throw EzyPhotoError.failed("This PDF has no pages.") }
        switch id {
        case "pdf-to-text":
            var parts: [String] = []
            for i in 0..<doc.pageCount {
                let text = (doc.page(at: i)?.string ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                if !text.isEmpty { parts.append(doc.pageCount > 1 ? "Page \(i + 1)\n\(text)" : text) }
            }
            guard !parts.isEmpty else { throw EzyPhotoError.failed("No text found: this PDF is a scan. Use Image to Text on ezyourlife.com.") }
            return .text(parts.joined(separator: "\n\n"))
        case "pdf-to-jpg":
            let n = min(max(1, Int(v["page"] ?? "") ?? 1), doc.pageCount)
            guard let page = doc.page(at: n - 1) else { throw EzyPhotoError.failed("That page isn't in the PDF.") }
            let box = page.bounds(for: .mediaBox)
            let scale = min(2400 / max(box.width, box.height), 3)
            let picture = page.thumbnail(of: CGSize(width: box.width * scale, height: box.height * scale), for: .mediaBox)
            guard let data = picture.jpegData(compressionQuality: 0.9) else { throw EzyPhotoError.failed("Couldn't save the page.") }
            return .image(data, type: "public.jpeg")
        case "rotate-pdf":
            let t = v["turn"] ?? ""
            let by = t.hasPrefix("Left") ? 270 : t.hasPrefix("Upside") ? 180 : 90
            for i in 0..<doc.pageCount { if let p = doc.page(at: i) { p.rotation = (p.rotation + by) % 360 } }
            return .image(try pdfData(doc), type: "com.adobe.pdf")
        case "split-pdf":
            let keep = pageList(v["pages"] ?? "", count: doc.pageCount)
            guard !keep.isEmpty else { throw EzyPhotoError.failed("Name the pages to keep, like 1-3, 5. This PDF has \(doc.pageCount) pages.") }
            let out = PDFDocument()
            for (n, i) in keep.enumerated() { if let p = doc.page(at: i)?.copy() as? PDFPage { out.insert(p, at: n) } }
            return .image(try pdfData(out), type: "com.adobe.pdf")
        default: // merge-pdf
            let second = try pdf(v, "pdf2")
            for i in 0..<second.pageCount { if let p = second.page(at: i)?.copy() as? PDFPage { doc.insert(p, at: doc.pageCount) } }
            return .image(try pdfData(doc), type: "com.adobe.pdf")
        }
    }

    private static func pdfData(_ doc: PDFDocument) throws -> Data {
        guard let data = doc.dataRepresentation() else { throw EzyPhotoError.failed("Couldn't save the PDF.") }
        return data
    }

    /// One picture on one page: A4 with a small margin, or the picture's own size.
    private static func imagePDF(_ input: CIImage, a4: Bool) throws -> Data {
        let picture = UIImage(cgImage: try cgImage(input))
        let px = picture.size
        let landscape = px.width > px.height
        let page: CGSize = a4 ? (landscape ? CGSize(width: 842, height: 595) : CGSize(width: 595, height: 842)) : CGSize(width: px.width * 72 / 150, height: px.height * 72 / 150)
        let margin: CGFloat = a4 ? 24 : 0
        let area = CGRect(origin: .zero, size: page).insetBy(dx: margin, dy: margin)
        let k = min(area.width / px.width, area.height / px.height)
        let drawn = CGSize(width: px.width * k, height: px.height * k)
        let rect = CGRect(x: area.midX - drawn.width / 2, y: area.midY - drawn.height / 2, width: drawn.width, height: drawn.height)
        return UIGraphicsPDFRenderer(bounds: CGRect(origin: .zero, size: page)).pdfData { ctx in
            ctx.beginPage()
            picture.draw(in: rect)
        }
    }

    // MARK: Input

    private static func photo(_ v: [String: String], _ key: String = "photo") throws -> CIImage {
        guard let url = v[key], let comma = url.firstIndex(of: ","),
              let data = Data(base64Encoded: String(url[url.index(after: comma)...])),
              let image = CIImage(data: data, options: [.applyOrientationProperty: true]) else { throw EzyPhotoError.noPhoto }
        return image.transformed(by: CGAffineTransform(translationX: -image.extent.minX, y: -image.extent.minY))
    }

    private static func copiedData() -> Data? {
        let board = UIPasteboard.general
        for t in ["public.jpeg", "public.heic", "public.png", "public.heif", "public.image"] {
            if let d = board.data(forPasteboardType: t) { return d }
        }
        return nil
    }

    private static func range(_ s: String) -> ClosedRange<Double>? {
        let nums = s.split(whereSeparator: { !"0123456789.".contains($0) }).compactMap { Double($0) }
        if nums.count >= 2 { return min(nums[0], nums[1])...max(nums[0], nums[1]) }
        if let one = nums.first { return max(1, one * 0.85)...one }
        return nil
    }

    private static func pixels(_ w: Double, _ h: Double, _ unit: String, dpi: Double) -> CGSize {
        let f: Double
        switch unit {
        case "cm": f = dpi / 2.54
        case "mm": f = dpi / 25.4
        case "inch": f = dpi
        default: f = 1
        }
        return CGSize(width: (w * f).rounded(), height: (h * f).rounded())
    }

    // MARK: Geometry

    /// Scales to cover the size and crops the rest; with faceAware, keeps the face in the upper middle.
    private static func fill(_ image: CIImage, _ size: CGSize, faceAware: Bool) -> CIImage {
        let e = image.extent
        let scale = max(size.width / e.width, size.height / e.height)
        let scaled = image.applyingFilter("CILanczosScaleTransform", parameters: [kCIInputScaleKey: scale, kCIInputAspectRatioKey: 1])
        var cx = scaled.extent.midX, cy = scaled.extent.midY
        if faceAware, let face = (try? faceRects(image))?.max(by: { $0.width < $1.width }) {
            cx = face.midX * scale
            // Face centre about 55% up from the bottom, like passport rules.
            cy = face.midY * scale - size.height * 0.05
        }
        let x = min(max(cx - size.width / 2, scaled.extent.minX), scaled.extent.maxX - size.width)
        let y = min(max(cy - size.height / 2, scaled.extent.minY), scaled.extent.maxY - size.height)
        let crop = CGRect(x: x, y: y, width: size.width, height: size.height)
        return scaled.cropped(to: crop).transformed(by: CGAffineTransform(translationX: -crop.minX, y: -crop.minY))
    }

    /// Fits the whole image inside the size, on white or on a blurred copy of itself.
    private static func fit(_ image: CIImage, _ size: CGSize, blurredBackground: Bool) -> CIImage {
        let e = image.extent
        let scale = min(size.width / e.width, size.height / e.height)
        let scaled = image.applyingFilter("CILanczosScaleTransform", parameters: [kCIInputScaleKey: scale, kCIInputAspectRatioKey: 1])
        let placed = scaled.transformed(by: CGAffineTransform(translationX: (size.width - scaled.extent.width) / 2 - scaled.extent.minX,
                                                             y: (size.height - scaled.extent.height) / 2 - scaled.extent.minY))
        let canvas = CGRect(origin: .zero, size: size)
        let back: CIImage = blurredBackground
            ? fill(image, size, faceAware: false).clampedToExtent().applyingGaussianBlur(sigma: 30).cropped(to: canvas)
            : CIImage(color: .white).cropped(to: canvas)
        return placed.composited(over: back).cropped(to: canvas)
    }

    private static func pixelate(_ image: CIImage, blocks: CGFloat) -> CIImage {
        let scale = max(image.extent.width, image.extent.height) / blocks
        return image.applyingFilter("CIPixellate", parameters: [kCIInputScaleKey: scale, kCIInputCenterKey: CIVector(x: 0, y: 0)]).cropped(to: image.extent)
    }

    private static func autoAdjust(_ image: CIImage) -> CIImage {
        image.autoAdjustmentFilters(options: [.redEye: false]).reduce(image) { img, f in
            f.setValue(img, forKey: kCIInputImageKey)
            return f.outputImage ?? img
        }
    }

    private static func sharpen(_ image: CIImage, amount: Double) -> CIImage {
        image.applyingFilter("CINoiseReduction", parameters: ["inputNoiseLevel": 0.02, "inputSharpness": 0.4])
            .applyingFilter("CISharpenLuminance", parameters: [kCIInputSharpnessKey: amount])
            .cropped(to: image.extent)
    }

    // MARK: Vision

    private static func faceRects(_ image: CIImage) throws -> [CGRect] {
        let request = VNDetectFaceRectanglesRequest()
        try VNImageRequestHandler(ciImage: image).perform([request])
        let e = image.extent
        return (request.results ?? []).map { o in
            CGRect(x: e.minX + o.boundingBox.minX * e.width, y: e.minY + o.boundingBox.minY * e.height,
                   width: o.boundingBox.width * e.width, height: o.boundingBox.height * e.height)
        }
    }

    /// White where the person or product is, black elsewhere.
    private static func subjectMask(_ image: CIImage) throws -> CIImage? {
        if #available(iOS 17.0, *) {
            let request = VNGenerateForegroundInstanceMaskRequest()
            let handler = VNImageRequestHandler(ciImage: image)
            try handler.perform([request])
            if let result = request.results?.first {
                let buffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
                return CIImage(cvPixelBuffer: buffer)
            }
            return nil
        }
        let request = VNGeneratePersonSegmentationRequest()
        request.qualityLevel = .balanced
        try VNImageRequestHandler(ciImage: image).perform([request])
        guard let buffer = request.results?.first?.pixelBuffer else { return nil }
        let mask = CIImage(cvPixelBuffer: buffer)
        return mask.transformed(by: CGAffineTransform(scaleX: image.extent.width / mask.extent.width, y: image.extent.height / mask.extent.height))
    }

    // MARK: Drawing

    private static func cgImage(_ image: CIImage) throws -> CGImage {
        guard let cg = context.createCGImage(image, from: image.extent) else { throw EzyPhotoError.failed("Couldn't make the picture.") }
        return cg
    }

    private static func overlay(_ id: String, _ input: CIImage, _ v: [String: String]) throws -> Data {
        let cg = try cgImage(input)
        let w = CGFloat(cg.width), h = CGFloat(cg.height)
        let band: CGFloat = id == "add-name-dob-photo" ? h * 0.18 : 0
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let image = UIGraphicsImageRenderer(size: CGSize(width: w, height: h + band), format: format).image { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(x: 0, y: 0, width: w, height: h + band))
            UIImage(cgImage: cg).draw(in: CGRect(x: 0, y: 0, width: w, height: h))
            let para = NSMutableParagraphStyle()
            para.alignment = .center
            switch id {
            case "add-name-dob-photo":
                let font = UIFont.boldSystemFont(ofSize: band * 0.32)
                let text = "\(v["name"] ?? "")\n\(v["dob"] ?? "")"
                (text as NSString).draw(in: CGRect(x: 4, y: h + band * 0.08, width: w - 8, height: band * 0.9),
                                        withAttributes: [.font: font, .foregroundColor: UIColor.black, .paragraphStyle: para])
            case "watermark-images":
                let text = v["text"] ?? ""
                let font = UIFont.boldSystemFont(ofSize: max(18, w / 14))
                let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: UIColor.white.withAlphaComponent(0.35)]
                let g = ctx.cgContext
                g.saveGState()
                g.translateBy(x: w / 2, y: h / 2)
                g.rotate(by: -.pi / 6)
                let step = font.lineHeight * 3
                var y = -max(w, h)
                while y < max(w, h) {
                    (text as NSString).draw(at: CGPoint(x: -max(w, h), y: y), withAttributes: attrs)
                    (text as NSString).draw(at: CGPoint(x: 0, y: y + step / 2), withAttributes: attrs)
                    y += step
                }
                g.restoreGState()
            default:
                let text = v["text"] ?? ""
                let font = UIFont.boldSystemFont(ofSize: max(18, w / 16))
                let shadow = NSShadow()
                shadow.shadowColor = UIColor.black.withAlphaComponent(0.7)
                shadow.shadowBlurRadius = 6
                let height = font.lineHeight * 2.4
                let pos = v["position"] ?? "Bottom"
                let y = pos == "Top" ? h * 0.04 : pos == "Middle" ? (h - height) / 2 : h - height - h * 0.04
                (text as NSString).draw(in: CGRect(x: w * 0.04, y: y, width: w * 0.92, height: height),
                                        withAttributes: [.font: font, .foregroundColor: UIColor.white, .shadow: shadow, .paragraphStyle: para])
            }
        }
        guard let out = image.cgImage else { throw EzyPhotoError.failed("Couldn't make the picture.") }
        return try encode(out, type: "public.jpeg", quality: 0.92, dpi: nil)
    }

    private static func signature(_ name: String) throws -> EzyPhotoOutput {
        let text = name.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { throw EzyPhotoError.failed("Add your name.") }
        let size = CGSize(width: 1200, height: 400)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let image = UIGraphicsImageRenderer(size: size, format: format).image { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
            let font = UIFont(name: "SnellRoundhand-Bold", size: 150) ?? UIFont.italicSystemFont(ofSize: 120)
            let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: UIColor(red: 0.05, green: 0.1, blue: 0.45, alpha: 1)]
            let s = (text as NSString).size(withAttributes: attrs)
            let scale = min(1, (size.width - 80) / s.width)
            ctx.cgContext.translateBy(x: size.width / 2, y: size.height / 2)
            ctx.cgContext.scaleBy(x: scale, y: scale)
            (text as NSString).draw(at: CGPoint(x: -s.width / 2, y: -s.height / 2), withAttributes: attrs)
        }
        guard let cg = image.cgImage else { throw EzyPhotoError.failed("Couldn't make the signature.") }
        return .image(try encode(cg, type: "public.png", quality: 1, dpi: 300), type: "public.png")
    }

    // MARK: Encoding

    private static func png(_ image: CIImage) throws -> Data {
        try encode(try cgImage(image), type: "public.png", quality: 1, dpi: nil)
    }

    /// JPEG, optionally with a DPI and squeezed or padded into a file-size range in KB.
    private static func jpeg(_ image: CIImage, dpi: Double?, kb: ClosedRange<Double>?) throws -> Data {
        let cg = try cgImage(image)
        guard let kb else { return try encode(cg, type: "public.jpeg", quality: 0.9, dpi: dpi) }
        let maxBytes = Int(kb.upperBound * 1024), minBytes = Int(kb.lowerBound * 1024)
        var best = try encode(cg, type: "public.jpeg", quality: 0.95, dpi: dpi)
        if best.count > maxBytes {
            var lo = 0.05, hi = 0.95
            var fitting: Data?
            for _ in 0..<8 {
                let q = (lo + hi) / 2
                let d = try encode(cg, type: "public.jpeg", quality: q, dpi: dpi)
                if d.count <= maxBytes { fitting = d; lo = q } else { hi = q }
            }
            if let fitting { best = fitting } else {
                // Still too big at the lowest quality: make the picture smaller.
                let smaller = image.applyingFilter("CILanczosScaleTransform", parameters: [kCIInputScaleKey: 0.7, kCIInputAspectRatioKey: 1])
                return try jpeg(smaller, dpi: dpi, kb: kb)
            }
        }
        if best.count < minBytes { best = padJPEG(best, to: minBytes + 512) }
        return best
    }

    /// Adds a comment block so a JPEG reaches a minimum file size (forms that reject small files).
    private static func padJPEG(_ data: Data, to target: Int) -> Data {
        guard data.count >= 2, data[0] == 0xFF, data[1] == 0xD8 else { return data }
        var out = Data([0xFF, 0xD8])
        var need = target - data.count
        while need > 4 {
            let chunk = min(need - 4, 65_000)
            out.append(contentsOf: [0xFF, 0xFE, UInt8((chunk + 2) >> 8), UInt8((chunk + 2) & 0xFF)])
            out.append(Data(repeating: 0x20, count: chunk))
            need -= chunk + 4
        }
        out.append(data.dropFirst(2))
        return out
    }

    private static func encode(_ cg: CGImage, type: String, quality: Double, dpi: Double?) throws -> Data {
        let data = NSMutableData()
        guard let dest = CGImageDestinationCreateWithData(data, type as CFString, 1, nil) else { throw EzyPhotoError.failed("Couldn't save the picture.") }
        var props: [CFString: Any] = [kCGImageDestinationLossyCompressionQuality: quality]
        if let dpi {
            props[kCGImagePropertyDPIWidth] = dpi
            props[kCGImagePropertyDPIHeight] = dpi
            props[kCGImagePropertyJFIFDictionary] = [kCGImagePropertyJFIFXDensity: dpi, kCGImagePropertyJFIFYDensity: dpi, kCGImagePropertyJFIFDensityUnit: 1]
        }
        CGImageDestinationAddImage(dest, cg, props as CFDictionary)
        guard CGImageDestinationFinalize(dest) else { throw EzyPhotoError.failed("Couldn't save the picture.") }
        return data as Data
    }

    // MARK: Details

    private static func metadata(detailed: Bool) throws -> String {
        guard let data = copiedData(), let source = CGImageSourceCreateWithData(data as CFData, nil),
              let p = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any] else { throw EzyPhotoError.noPhoto }
        let w = p[kCGImagePropertyPixelWidth] as? Double ?? 0, h = p[kCGImagePropertyPixelHeight] as? Double ?? 0
        let dpi = p[kCGImagePropertyDPIWidth] as? Double ?? 72
        var lines = [
            "Size: \(Int(w)) × \(Int(h)) px",
            "DPI: \(Int(dpi))",
            String(format: "Print size at %d DPI: %.1f × %.1f cm", Int(dpi), w / dpi * 2.54, h / dpi * 2.54),
            String(format: "File: %.0f KB", Double(data.count) / 1024),
        ]
        if detailed {
            let tiff = p[kCGImagePropertyTIFFDictionary] as? [CFString: Any] ?? [:]
            let exif = p[kCGImagePropertyExifDictionary] as? [CFString: Any] ?? [:]
            if let make = tiff[kCGImagePropertyTIFFMake] as? String { lines.append("Camera: \(make) \(tiff[kCGImagePropertyTIFFModel] as? String ?? "")") }
            if let date = exif[kCGImagePropertyExifDateTimeOriginal] as? String { lines.append("Taken: \(date)") }
            lines.append(p[kCGImagePropertyGPSDictionary] != nil ? "Location: saved in the photo" : "Location: none")
        }
        return lines.joined(separator: "\n")
    }

    private static func stripMetadata(_ v: [String: String]) throws -> EzyPhotoOutput {
        // Copy the original without its details when possible (no quality loss), else re-save the photo.
        if let data = copiedData(), let source = CGImageSourceCreateWithData(data as CFData, nil), let type = CGImageSourceGetType(source) {
            let out = NSMutableData()
            if let dest = CGImageDestinationCreateWithData(out, type, 1, nil) {
                let options: [CFString: Any] = [
                    kCGImageDestinationMetadata: CGImageMetadataCreateMutable(),
                    kCGImageDestinationMergeMetadata: false,
                    kCGImageMetadataShouldExcludeGPS: true,
                    kCGImageMetadataShouldExcludeXMP: true,
                ]
                var error: Unmanaged<CFError>?
                if CGImageDestinationCopyImageSource(dest, source, options as CFDictionary, &error) {
                    return .image(out as Data, type: type as String)
                }
            }
        }
        return .image(try jpeg(try photo(v), dpi: nil, kb: nil), type: "public.jpeg")
    }

    private static func colours(_ image: CIImage) throws -> String {
        let small = image.applyingFilter("CILanczosScaleTransform", parameters: [kCIInputScaleKey: 48 / max(image.extent.width, image.extent.height), kCIInputAspectRatioKey: 1])
        let cg = try cgImage(small)
        let w = cg.width, h = cg.height
        var pixels = [UInt8](repeating: 0, count: w * h * 4)
        guard let ctx = CGContext(data: &pixels, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                  space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { throw EzyPhotoError.failed("Couldn't read the colours.") }
        ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
        var buckets: [Int: (n: Int, r: Int, g: Int, b: Int)] = [:]
        for i in stride(from: 0, to: pixels.count, by: 4) {
            let r = Int(pixels[i]), g = Int(pixels[i + 1]), b = Int(pixels[i + 2])
            let key = (r >> 5) << 6 | (g >> 5) << 3 | (b >> 5)
            let cur = buckets[key] ?? (0, 0, 0, 0)
            buckets[key] = (cur.n + 1, cur.r + r, cur.g + g, cur.b + b)
        }
        let top = buckets.values.sorted { $0.n > $1.n }.prefix(6)
        let total = Double(w * h)
        return "Main colours:\n" + top.map { c in
            let hex = String(format: "#%02X%02X%02X", c.r / c.n, c.g / c.n, c.b / c.n)
            return "\(hex)  RGB(\(c.r / c.n), \(c.g / c.n), \(c.b / c.n))  \(Int(Double(c.n) / total * 100))%"
        }.joined(separator: "\n")
    }
}
