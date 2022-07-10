interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

type Address = Flavor<number, "Address">;
type Byte = Flavor<number, "Byte">;
type Word = Flavor<number, "Word">;
type Opcode = Flavor<number, "Opcode">;

interface AddressBus {
  read(addr: Address): Byte;
  readWord(addr: Address): Word;
  write(addr: Address, data: Byte);
  writeWord(addr: Address, data: Word);
}
