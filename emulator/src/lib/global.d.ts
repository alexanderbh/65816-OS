interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

type Byte = Flavor<number, "Byte">;
type Word = Flavor<number, "Word">;
type Opcode = Flavor<number, "Opcode">;
type Address = Word;

interface AddressBus {
  read(addr: Word): Byte;
  readWord(addr: Word): Word;
  write(addr: Word, data: Byte);
  writeWord(addr: Word, data: Word);
}
