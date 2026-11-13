import { registerPlugin } from "@capacitor/core";
import { isIosApp } from "./nativeApp";

/*
 * The EZYOURLIFE keyboard and the "Ask EZYOURLIFE" Siri command live in the iOS app (ios/App/Keyboard,
 * ios/App/App/AskEzyourlifeIntent.swift). This bridge hands them the person's API key, through the
 * native EzyKeyboard plugin (ios/App/App/EzyKeyboardPlugin.swift). Only works inside the iOS app.
 * See docs/ios-keyboard.md.
 */
interface EzyKeyboardPlugin {
  status(): Promise<{ connected: boolean; shortcuts: number }>;
  connect(options: { key: string }): Promise<{ connected: boolean; shortcuts: number }>;
  disconnect(): Promise<{ connected: boolean }>;
  openSettings(): Promise<void>;
}

const EzyKeyboard = registerPlugin<EzyKeyboardPlugin>("EzyKeyboard");

/** True when this app build has the keyboard (older App Store builds don't have the plugin). */
export async function keyboardStatus(): Promise<{ available: boolean; connected: boolean; shortcuts: number }> {
  if (!isIosApp()) return { available: false, connected: false, shortcuts: 0 };
  try {
    const s = await EzyKeyboard.status();
    return { available: true, ...s };
  } catch {
    return { available: false, connected: false, shortcuts: 0 };
  }
}

export const connectKeyboard = (key: string) => EzyKeyboard.connect({ key });
export const disconnectKeyboard = () => EzyKeyboard.disconnect();
export const openAppSettings = () => EzyKeyboard.openSettings();
