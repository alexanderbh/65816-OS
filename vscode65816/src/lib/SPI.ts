export interface SPI {
  clock(clk: boolean, mosi: boolean): boolean;
  deselect(): void;
}
