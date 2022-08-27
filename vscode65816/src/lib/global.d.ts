interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

type Byte = Flavor<number, "Byte">;
type Word = Flavor<number, "Word">;
type Sesqui = Flavor<number, "Sesqui">;
type Opcode = Flavor<number, "Opcode">;
type Address = Sesqui;

interface AddressBus {
  read(addr: Address): Byte;
  readWord(addr: Address): Word;
  readSesqui(addr: Address): Sesqui;
  write(addr: Address, data: Byte): void;
  writeWord(addr: Address, data: Word): void;
  readSlice(addr: Address, length: number): Uint8Array;
  writeSlice(addr: Address, data: Uint8Array): void;
}
