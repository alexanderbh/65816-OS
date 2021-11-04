.include "bios.inc"                         ; include BIOS includes
.include "via.inc"                          ; include VIA labels
.include "../drivers/spi/spi.asm"           ; include SPI code
.include "../drivers/ra8875/ra8875.asm"     ; include Driver for RA8875

.include "ramtest.asm"
.include "ramtest_wide.asm"


InitBIOS:
    JSR InitSPI
    JSR InitRA8875

    JSR RamTestRun
    
; switch out of emulation mode
    clc
    xce
    
    jsr RamTestWideRegistersRun
    jsr RamTestWideRun

    LDA #%00011100
    jsr RA8875_SetForegroundColor

    write bios_init
    write ok_string

    RTS

BiosFail:
    write fail_string
    rts