flash:
	make clean
	make build
	minipro -p AT28C256 -w bin/main.bin

clean:
	rm -f output/rom.o

build:
	ca65 --cpu 65C02 -o obj/main.o src/main.asm
	ld65 -v -C ca65.config -m ca65.map -o bin/main.bin obj/main.o

build-debug:
	ca65 --cpu 65C02 -g -l obj/main.lst -o obj/main.o src/main.asm
	ld65 -v -Ln bin/main.ln --dbgfile bin/main.dbg -C ca65.config -m ca65.map -o bin/main.bin obj/main.o
