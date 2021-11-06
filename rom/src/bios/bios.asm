.include "bios.inc"                         ; include BIOS includes
.include "via.inc"                          ; include VIA labels
.include "../drivers/spi/spi.asm"           ; include SPI code
.include "../drivers/ra8875/ra8875.asm"     ; include Driver for RA8875

.include "ramtest.asm"
.include "ramtest_wide.asm"


InitBIOS:
    JSR InitSPI
    JSR InitRA8875

    LDA #%01101111
    jsr RA8875_SetForegroundColor

    write welcome_logo1
    write welcome_logo2
    write welcome_logo3
    write welcome_logo4
    write welcome_logo5
    write welcome_logo6
    write welcome_logo7

    lda #$0A
    jsl RA8875_WriteChar

    LDA #%11111111
    jsr RA8875_SetForegroundColor

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


    LDA #%11111111
    jsr RA8875_SetForegroundColor

    RTS

BiosFail:
    write fail_string
    rts