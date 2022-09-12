/* eslint-disable @typescript-eslint/naming-convention */

import { HandshakeDevice } from "./System";

/**
 * This is a hack for now. Instead of timing it assumes the CPU asks for each key twice.
 * So it returns each scan code 2 times. Normally this is time based such that after the two
 * reads the next scan code will have been provided by the ps/2 keyboard.
 */

export class Keyboard implements HandshakeDevice {
  public lowToHighCallback: (() => void) | undefined = undefined;
  public highToLowCallback: (() => void) | undefined = undefined;

  public interruptTransition: (level: 1 | 0) => void = () => {};
  private buffer: Byte[] = [];

  keyDown(event: any) {
    // console.log(JSON.stringify(event));
    let scanCode = keysToScanCodes[event.code];
    if (typeof scanCode === "number") {
      scanCode = [scanCode];
    }
    scanCode = scanCode.flatMap((s) => [s, s]);
    console.log(scanCode.map((p) => p.toString(16).toUpperCase()));
    this.buffer.push(...scanCode);
    this.highToLowCallback && this.highToLowCallback();
  }
  keyUp(event: any) {
    // console.log(JSON.stringify(event));
    let scanCode = keysToScanCodes[event.code];
    if (typeof scanCode === "number") {
      scanCode = [scanCode];
    }
    scanCode = scanCode.flatMap((s) => [s, s]);
    scanCode = [0xf0, 0xf0, ...scanCode];
    console.log(scanCode.map((p) => p.toString(16).toUpperCase()));
    this.buffer.push(...scanCode);
    this.highToLowCallback && this.highToLowCallback();
  }

  readByte(): Byte {
    const b = this.buffer.shift() || 0;
    if (this.buffer.length <= 0) {
      this.lowToHighCallback && this.lowToHighCallback();
    } else {
      this.highToLowCallback && this.highToLowCallback();
    }
    return b;
  }

  writeByte(b: Byte): void {
    // throw new Error("writeByte on keyboard not implemented.");
  }
}

const keysToScanCodes: Record<string, number | number[]> = {
  Backquote: 0x0e,
  Digit1: 0x16,
  Digit2: 0x1e,
  Digit3: 0x26,
  Digit4: 0x25,
  Digit5: 0x2e,
  Digit6: 0x36,
  Digit7: 0x3d,
  Digit8: 0x3e,
  Digit9: 0x46,
  Digit0: 0x45,
  Minus: 0x4e,
  Equal: 0x55,
  KeyA: 0x1c,
  KeyB: 0x32,
  KeyC: 0x21,
  KeyD: 0x23,
  KeyE: 0x24,
  KeyF: 0x2b,
  KeyG: 0x34,
  KeyH: 0x33,
  KeyI: 0x43,
  KeyJ: 0x3b,
  KeyK: 0x42,
  KeyL: 0x4b,
  KeyM: 0x3a,
  KeyN: 0x31,
  KeyO: 0x44,
  KeyP: 0x4d,
  KeyQ: 0x15,
  KeyR: 0x2d,
  KeyS: 0x1b,
  KeyT: 0x2c,
  KeyU: 0x3c,
  KeyV: 0x2a,
  KeyW: 0x1d,
  KeyX: 0x22,
  KeyY: 0x35,
  KeyZ: 0x1a,
  BracketLeft: 0x54,
  BracketRight: 0x5b,
  Backslash: 0x5d,
  Semicolon: 0x4c,
  Quote: 0x52,
  Enter: 0x5a,
  Comma: 0x41,
  Period: 0x49,
  Slash: 0x4a,
  Backspace: 0x66,
  Tab: 0x0d,
  CapsLock: 0x58,
  ShiftLeft: 0x12,
  ControlLeft: 0x14,
  AltLeft: 0x11,
  Space: 0x29,
  AltRight: [0xe011, 0xe0f011],
  ControlRight: [0xe014, 0xe0f014],
  ShiftRight: 0x59,
  Alt: 0x11,
  Delete: [0xe071, 0xe0f071],
  End: [0xe069, 0xe0f069],
  Home: [0xe06c, 0xe0f06c],
  Insert: [0xe070, 0xe0f070],
  PageDown: [0xe07a, 0xe0f07a],
  PageUp: [0xe07d, 0xe0f07d],
  ArrowDown: [0xe072, 0xe0f072],
  ArrowLeft: [0xe06b, 0xe0f06b],
  ArrowRight: [0xe074, 0xe0f074],
  ArrowUp: [0xe075, 0xe0f075],
  NumLock: 0x77,
  Numpad0: 0x70,
  Numpad1: 0x69,
  Numpad2: 0x72,
  Numpad3: 0x7a,
  Numpad4: 0x6b,
  Numpad5: 0x73,
  Numpad6: 0x74,
  Numpad7: 0x6c,
  Numpad8: 0x75,
  Numpad9: 0x7d,
  NumpadAdd: 0x79,
  NumpadDecimal: 0x71,
  NumpadComma: 0x71,
  NumpadDivide: [0xe04a, 0xe0f04a],
  NumpadEnter: [0xe05a, 0xe0f05a],
  NumpadMultiply: 0x7c,
  NumpadStar: 0x7c,
  NumpadSubtract: 0x7b,
  Escape: 0x76,
  F1: 0x05,
  F2: 0x06,
  F3: 0x04,
  F4: 0x0c,
  F5: 0x03,
  F6: 0x0b,
  F7: 0x83,
  F8: 0x0a,
  F9: 0x01,
  F10: 0x09,
  F11: 0x78,
  F12: 0x07,
  PrintScreen: [0xe012e07c, 0xe0f07ce0f012],
  ScrollLock: 0x7e,
  Pause: [0xe11477e1, 0xf014f077],
  Power: [0xe037, 0xe0f037],
  Sleep: [0xe03f, 0xe0f03f],
  WakeUp: [0xe05e, 0xe0f05e],
};
