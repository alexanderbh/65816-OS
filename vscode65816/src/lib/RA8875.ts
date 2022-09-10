import * as vscode from "vscode";
import { SPI } from "./SPI";
import { join, high, low } from "./Utils";

export class RA8875 implements SPI {
  private cycleType: undefined | "cmd_write" | "data_write" | "data_read" =
    undefined;

  private cmdWritten: undefined | Byte;

  private byte: Byte = 0;
  private byteCyclesLeft = 8;
  private cursorX: Word = 0;
  private cursorY: Word = 0;
  constructor(private panel: vscode.WebviewPanel) {}

  deselect(): void {
    this.byte = 0;
    this.byteCyclesLeft = 8;
  }

  clock(clk: boolean, mosi: boolean): boolean {
    if (clk) {
      this.byte = (this.byte << 1) | (mosi ? 1 : 0);
      this.byteCyclesLeft--;
      if (this.cycleType === "data_read") {
        const byteToReturn = this.handleDataRead();

        const bitToReturn = ((byteToReturn >> this.byteCyclesLeft) & 1) > 0;

        if (this.byteCyclesLeft === 0) {
          this.byteCyclesLeft = 8;
          this.cycleType = undefined;
        }
        return bitToReturn;
      }

      if (this.byteCyclesLeft === 0) {
        this.handleByte();
        this.byteCyclesLeft = 8;
        this.byte = 0;
      }
    }
    return false;
  }

  handleByte(): Byte {
    if (this.cycleType === undefined) {
      if (this.byte === 0x80) {
        this.cycleType = "cmd_write";
      }
      if (this.byte === 0x00) {
        this.cycleType = "data_write";
      }
      if (this.byte === 0x40) {
        this.cycleType = "data_read";
      }
      return 0;
    }

    if (this.cycleType === "cmd_write") {
      this.cmdWritten = this.byte;
      this.cycleType = undefined;
      return 0;
    }

    if (!this.cmdWritten) {
      console.error("No command written");
      throw new Error("No command written");
    }

    if (this.cycleType === "data_write") {
      this.handleDataWrite();
      return 0;
    }

    return 0;
  }
  handleDataRead(): Byte {
    switch (this.cmdWritten) {
      case RA8875_F_CURXL:
        return low(this.cursorX);
      case RA8875_F_CURXH:
        return high(this.cursorX);
      case RA8875_F_CURYL:
        return low(this.cursorY);
      case RA8875_F_CURYH:
        return high(this.cursorY);
      default:
        console.log("RA8875 Read not supported", this.cmdWritten);
        return 0;
    }
  }

  handleDataWrite() {
    this.cycleType = undefined;
    switch (this.cmdWritten) {
      case RA8875_MRWC:
        return this.handleWriteMRWC();
      case RA8875_F_CURXL:
        this.cursorX = join(this.byte, high(this.cursorX));
        this.panel.webview.postMessage({
          command: "cursorx",
          value: this.cursorX,
        });
        break;
      case RA8875_F_CURXH:
        this.cursorX = join(low(this.cursorX), this.byte);
        this.panel.webview.postMessage({
          command: "cursorx",
          value: this.cursorX,
        });
        break;
      case RA8875_F_CURYL:
        this.cursorY = join(this.byte, high(this.cursorY));
        this.panel.webview.postMessage({
          command: "cursory",
          value: this.cursorY,
        });
        break;
      case RA8875_F_CURYH:
        this.cursorY = join(low(this.cursorY), this.byte);
        this.panel.webview.postMessage({
          command: "cursory",
          value: this.cursorY,
        });
        break;
      default:
        this.cmdWritten = 0;
        break;
    }
  }
  handleWriteMRWC() {
    this.panel.webview.postMessage({
      command: "write",
      char: this.byte,
    });

    this.cursorX += 8;
    if (this.cursorX > 800) {
      this.cursorX = 0;
      this.cursorY += 16;
    }
  }
}

const RA8875_MRWC = 0x02;
const RA8875_F_CURXL = 0x2a;
const RA8875_F_CURXH = 0x2b;
const RA8875_F_CURYL = 0x2c;
const RA8875_F_CURYH = 0x2d;
