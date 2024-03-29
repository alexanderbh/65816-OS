.include "bios.inc"                         ; include BIOS includes
.include "via.inc"                          ; include VIA labels
.include "drivers/spi/spi.asm"           ; include SPI code
.include "drivers/keyboard/keyboard.asm" ; include Keyboard driver
.include "drivers/ra8875/ra8875.asm"     ; include Driver for RA8875
.include "drivers/ra8875/ra8875_api.asm" ; include API for RA8875
.include "drivers/usb245r/usb245r.asm"

.include "ramtest.asm"
.include "ramtest_wide.asm"

.A8
.I8
InitBIOS:
    JSR InitUSB245R
    JSR InitSPI
    JSR InitRA8875
    JSR InitKeyboard

  
; switch out of emulation mode
    clc
    xce

    ;pea test_bios
    ;jsl RA8875_WriteString16
    ;pla
    
    ;shortr
    ;LDA #%01101111
    ;jsr RA8875_SetForegroundColor
    ;longr


    ;write welcome_logo1
    ;write welcome_logo2
    ;write welcome_logo3
    ;write welcome_logo4
    ;write welcome_logo5
    ;write welcome_logo6
    ;write welcome_logo7

    ;lda #$0A
    ;jsl RA8875_WriteChar16

    ;shortr
    ;LDA #%11111111
    ;jsr RA8875_SetForegroundColor
    ;longr

;; why is this not working????
    ; JSL RamTestRun


    
    ; jsr RamTestWideRegistersRun
    ; jsr RamTestWideRun

    ;shortr
    ;LDA #%00011100
    ;jsr RA8875_SetForegroundColor
    longr

    write data_ok_bracket
    write bios_init


    ;shortr
    ;LDA #%11111111
    ;jsr RA8875_SetForegroundColor
    ;longr
    
    ; write ansi_string
    
    shortr
    lda #$0A
    jsl RA8875_WriteChar
    RTS