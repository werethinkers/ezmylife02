import UIKit

/*
 * The EZYOURLIFE keyboard: a normal iPhone-style keyboard with one strip on top.
 *
 * Type "/" (or "\") and a few letters in any app, and the strip shows your shortcuts and Ezyourlife apps:
 *   /pm             -> tap "pm" and its text replaces "/pm"
 *   /invo           -> tap "Proforma Invoice", type the details, tap "Run"
 *   /invo Rahul 5000 -> tap "Run Proforma Invoice · 2 credits" and the result replaces the command
 * A result made with Siri or the Action Button ("Ask EZYOURLIFE") shows first, ready to tap in.
 *
 * Apple rules this follows: a keyboard can't use the microphone (voice is the Siri command instead),
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
    private let keysStack = UIStackView()
    private var heightConstraint: NSLayoutConstraint?

    private var deleteTimer: Timer?
    private var deleteRepeats = 0

    // MARK: Strip state

    private var appResults: [EzyApp] = []
    private var lastQuery = ""
    private var searchTask: Task<Void, Never>?
    private var selectedApp: EzyApp?
    private var busy: String?
    private var notice: String?

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

        container.addSubview(strip)
        container.addSubview(keysStack)

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
        updateAutoShift()
        buildKeys()
        refreshStrip()
        if hasFullAccess, EzyShared.isConnected, EzyShared.shortcutsAge > 300 {
            Task { [weak self] in
                _ = try? await EzyAPI.refreshShortcuts()
                await MainActor.run { self?.refreshStrip() }
            }
        }
    }

    override func textDidChange(_ textInput: UITextInput?) {
        super.textDidChange(textInput)
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

    private func buildKeys() {
        guard isViewLoaded else { return }
        keysStack.arrangedSubviews.forEach { $0.removeFromSuperview() }
        view.backgroundColor = .clear
        for (index, row) in rows().enumerated() {
            let rowStack = UIStackView()
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
            key.addTarget(self, action: #selector(keyUp(_:)), for: [.touchUpInside])
            key.addTarget(self, action: #selector(keyCancel(_:)), for: [.touchUpOutside, .touchCancel])
        }
        return key
    }

    private func returnTitle() -> String {
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
            let before = textDocumentProxy.documentContextBeforeInput ?? ""
            if now.timeIntervalSince(lastSpaceTap) < 0.4, before.hasSuffix(" "), let c = before.dropLast().last, c.isLetter || c.isNumber {
                textDocumentProxy.deleteBackward()
                textDocumentProxy.insertText(". ")
            } else {
                textDocumentProxy.insertText(" ")
                if page != .letters { page = .letters }
            }
            lastSpaceTap = now
            afterTyping()
        case "return":
            textDocumentProxy.insertText("\n")
            afterTyping()
        default:
            var text = key.keyValue
            if page == .letters && shift != .off { text = text.uppercased() }
            textDocumentProxy.insertText(text)
            if page == .letters && shift == .once { shift = .off }
            if page != .letters && (text == "'" ) { page = .letters }
            afterTyping()
        }
    }

    private func deleteBackward() {
        textDocumentProxy.deleteBackward()
        afterTyping()
    }

    private func deleteWord() {
        let before = textDocumentProxy.documentContextBeforeInput ?? ""
        var count = 0
        for ch in before.reversed() {
            if ch.isWhitespace && count > 0 { break }
            count += 1
        }
        for _ in 0..<max(count, 1) { textDocumentProxy.deleteBackward() }
        afterTyping()
    }

    private func afterTyping() {
        updateAutoShift()
        buildKeys()
        refreshStrip()
    }

    private func updateAutoShift() {
        guard shift != .locked, page == .letters else { return }
        let type = textDocumentProxy.autocapitalizationType ?? .sentences
        if type == UITextAutocapitalizationType.none { shift = .off; return }
        if type == .allCharacters { shift = .once; return }
        let before = textDocumentProxy.documentContextBeforeInput ?? ""
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

    private func refreshStrip() {
        guard isViewLoaded else { return }
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

        guard let command = EzyMatch.command(in: textDocumentProxy.documentContextBeforeInput) else {
            selectedApp = nil
            if let last = EzyShared.lastResult, last.isFresh {
                addChip("Insert: \(last.title)", style: .primary) { [weak self] in self?.insertLastResult(last) }
            }
            addChip("Type / for shortcuts and apps", style: .note)
            addChip("🎙 Voice", style: .plain) { [weak self] in
                self?.notice = "Voice: press the Action Button or say “Hey Siri, ask EZYOURLIFE”. The result shows here."
                self?.refreshStrip()
            }
            return
        }

        let words = command.text.split(separator: " ", omittingEmptySubsequences: true)
        let first = words.first.map(String.init) ?? ""
        let details = words.dropFirst().joined(separator: " ")

        // A chosen app with details typed after it: offer to run it.
        if let app = selectedApp {
            let price = app.priceLabel.isEmpty ? "" : " · \(app.priceLabel)"
            if details.isEmpty && words.count <= 1 {
                addChip("\(app.name): type the details, then Run", style: .note)
            } else {
                addChip("▶ Run \(app.name)\(price)", style: .primary) { [weak self] in
                    self?.run(app: app, text: command.text, length: command.length)
                }
            }
            addChip("✕", style: .plain) { [weak self] in self?.selectedApp = nil; self?.refreshStrip() }
            return
        }

        // Shortcuts first (instant, from the saved copy), then apps (searched online).
        let shortcutHits = EzyMatch.shortcuts(EzyShared.shortcuts, for: first)
        for s in shortcutHits {
            let preview = s.value.replacingOccurrences(of: "\n", with: " ").prefix(28)
            addChip("\(s.key) · \(preview)", style: .shortcut) { [weak self] in
                self?.replaceCommand(length: command.length, with: s.value)
            }
        }
        let apps = first.isEmpty ? EzyShared.recentApps : appResults
        for app in apps.prefix(6) {
            let price = app.priceLabel.isEmpty ? "" : " · \(app.priceLabel)"
            addChip("\(app.name)\(price)", style: .app) { [weak self] in
                guard let self else { return }
                if app.runnable == false {
                    self.replaceCommand(length: command.length, with: app.link)
                } else if details.isEmpty {
                    self.selectedApp = app
                    if !command.text.hasSuffix(" ") { self.textDocumentProxy.insertText(" ") }
                    self.refreshStrip()
                } else {
                    self.run(app: app, text: details, length: command.length)
                }
            }
        }
        if shortcutHits.isEmpty && apps.isEmpty {
            addChip(first.isEmpty ? "Type a shortcut or an app name" : "Searching…", style: .note)
        }
        search(first)
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

    private func replaceCommand(length: Int, with text: String) {
        for _ in 0..<length { textDocumentProxy.deleteBackward() }
        textDocumentProxy.insertText(text)
        selectedApp = nil
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

    private func run(app: EzyApp, text: String, length: Int) {
        busy = "Working on \(app.name)…"
        refreshStrip()
        Task { [weak self] in
            do {
                let plan = try await EzyAPI.plan(text, appId: app.id)
                if let missing = plan.missing, !missing.isEmpty {
                    let list = missing.map(\.label).joined(separator: ", ")
                    await MainActor.run {
                        self?.busy = nil
                        self?.notice = "\(app.name) also needs: \(list). Add them and tap Run again."
                        self?.refreshStrip()
                    }
                    return
                }
                let result = try await EzyAPI.run(plan)
                if result.imageURL != nil { await EzyClipboard.copy(result) }
                await MainActor.run {
                    guard let self else { return }
                    self.busy = nil
                    self.replaceCommand(length: length, with: result.text)
                    if result.imageURL != nil { self.notice = "Image copied. Tap and hold the message box, then Paste." }
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

    // MARK: Chips

    private enum ChipStyle { case primary, shortcut, app, plain, note }

    private func addChip(_ title: String, style: ChipStyle, action: (() -> Void)? = nil) {
        let chip = ChipButton(type: .system)
        chip.setTitle(title, for: .normal)
        chip.titleLabel?.font = .systemFont(ofSize: 15, weight: style == .primary ? .semibold : .regular)
        chip.titleLabel?.lineBreakMode = .byTruncatingTail
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
