import UIKit
import ImageIO

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
        guard let data = resized.jpegData(compressionQuality: 0.85) else { return }
        card?.values[key] = "data:image/jpeg;base64," + data.base64EncodedString()
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
        if field.type == "image" {
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
