/**
 * ESC/POS command builder – fluent API to generate raw byte buffers
 * for thermal receipt printers (58mm / 80mm).
 *
 * Usage:
 *   const bytes = new EscPosBuilder()
 *     .initialize()
 *     .alignCenter()
 *     .bold(true).text("MI PIZZERÍA").bold(false)
 *     .feed(1)
 *     .alignLeft()
 *     .text("1x Pepperoni     S/25.00")
 *     .dashedLine()
 *     .bold(true).text("TOTAL  S/25.00").bold(false)
 *     .feed(3)
 *     .cut()
 *     .build();
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export class EscPosBuilder {
  private buffer: number[] = [];
  private charWidth = 48; // default 80mm paper

  /** Set character width for dashed lines (48 for 80mm, 32 for 58mm) */
  paperWidth(cols: number): this {
    this.charWidth = cols;
    return this;
  }

  /** ESC @ — Initialize printer */
  initialize(): this {
    this.buffer.push(ESC, 0x40);
    return this;
  }

  /** Raw text encoded as Latin-1 (covers most Spanish chars) + LF */
  text(content: string): this {
    for (let i = 0; i < content.length; i++) {
      this.buffer.push(content.charCodeAt(i) & 0xff);
    }
    this.buffer.push(LF);
    return this;
  }

  /** Raw text without trailing LF */
  raw(content: string): this {
    for (let i = 0; i < content.length; i++) {
      this.buffer.push(content.charCodeAt(i) & 0xff);
    }
    return this;
  }

  /** ESC d n — Feed n lines */
  feed(lines = 1): this {
    this.buffer.push(ESC, 0x64, lines);
    return this;
  }

  /** ESC a 0/1/2 — Align left / center / right */
  alignLeft(): this {
    this.buffer.push(ESC, 0x61, 0);
    return this;
  }
  alignCenter(): this {
    this.buffer.push(ESC, 0x61, 1);
    return this;
  }
  alignRight(): this {
    this.buffer.push(ESC, 0x61, 2);
    return this;
  }

  /** ESC E n — Bold on/off */
  bold(on: boolean): this {
    this.buffer.push(ESC, 0x45, on ? 1 : 0);
    return this;
  }

  /** ESC - n — Underline 0=off, 1=1dot, 2=2dot */
  underline(mode: 0 | 1 | 2 = 1): this {
    this.buffer.push(ESC, 0x2d, mode);
    return this;
  }

  /** GS ! n — Character size (0x00=normal, 0x11=double W+H, 0x10=double W, 0x01=double H) */
  size(width: 0 | 1, height: 0 | 1): this {
    this.buffer.push(GS, 0x21, (width << 4) | height);
    return this;
  }

  /** Convenience: double-height + double-width */
  doubleSize(): this {
    return this.size(1, 1);
  }

  /** Convenience: normal size */
  normalSize(): this {
    return this.size(0, 0);
  }

  /** ESC V m — Full cut (m=0) or partial cut (m=1) */
  cut(partial = false): this {
    this.buffer.push(GS, 0x56, partial ? 1 : 0);
    return this;
  }

  /** Print a dashed line across the full paper width */
  dashedLine(char = "-"): this {
    return this.text(char.repeat(this.charWidth));
  }

  /** Print "left       right" padded to paper width */
  columns(left: string, right: string): this {
    const space = this.charWidth - left.length - right.length;
    const padding = space > 0 ? " ".repeat(space) : " ";
    return this.text(`${left}${padding}${right}`);
  }

  /** Open cash drawer (ESC p 0 25 250) */
  openDrawer(): this {
    this.buffer.push(ESC, 0x70, 0, 25, 250);
    return this;
  }

  /** Emit an audible beep (ESC B n t) — not universal */
  beep(times = 1, duration = 3): this {
    this.buffer.push(ESC, 0x42, times, duration);
    return this;
  }

  /** Set code page (ESC t n) — 0=PC437, 16=WPC1252 (Latin-1) */
  codePage(n: number): this {
    this.buffer.push(ESC, 0x74, n);
    return this;
  }

  /** Append raw bytes */
  rawBytes(bytes: number[]): this {
    this.buffer.push(...bytes);
    return this;
  }

  /** Return the final Uint8Array ready to send to the printer */
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
