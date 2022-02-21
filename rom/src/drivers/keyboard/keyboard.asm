KB_CONTROL_RELEASE      = %00000001
KB_CONTROL_RELEASE_INV  = %11111110
KB_CONTROL_EXTENDED     = %00000010
KB_CONTROL_EXTENDED_INV = %11111101
KB_CONTROL_SHIFTED      = %10000000
KB_CONTROL_SHIFTED_INV  = %01111111

.include "keyboard_layout_iso.inc"

.SEGMENT "RAM"
    kb_byte:                            .res 1
    ; control byte:
    ; bit 0         - release
    ; bit 1         - extended
    ; bit 7         - shifted
    kb_control_byte:                    .res 1

.code

InterruptKeyboard:
    shortr

    lda VIA1A                               ; read byte from VIA
    sta kb_byte

; DEBUG SCANCODE
    ; lda #'['
    ; jsl RA8875_WriteChar
    ; lda kb_byte
    ; jsl RA8875_WriteHex
    ; lda #']'
    ; jsl RA8875_WriteChar

    ; Check control byte first
    lda kb_control_byte
    and #KB_CONTROL_RELEASE
    bne keyboardHandleRelease               ; Is release control set?
    lda kb_control_byte
    and #KB_CONTROL_EXTENDED
    bne keyboardHandleExtended              ; Is extended control set?


    lda kb_byte

    jsr keyboardCommandTest                 ; Test for non printable scan codes
    beq InterruptKeyboardReturn             ; 0 means key is handled as command


    jsr keyboardHandleAscii                 ; Handle as ASCII

InterruptKeyboardReturn:
    bit VIA1A
    longr
    rts

.A8
.I8
keyboardHandleAscii:
    lda kb_control_byte
    and #KB_CONTROL_SHIFTED                 ; Set bit 7 is shifted
    ora kb_byte

    tax
    lda ASCIITBL,x

    ldx #STREAM_STDIN
    ;jsl RA8875_WriteChar                    ; TODO: Do not print here
    jsl StreamPutC                          ; Put in standard in stream

    cmp #$69
    bne @return
    jsl Scheduler_NextTask
@return:
    rts

keyboardHandleRelease:
    lda kb_control_byte
    and #KB_CONTROL_RELEASE_INV
    sta kb_control_byte
    ; TODO: Toggle released key
    ;       Have a map of which keys are pressed
    
    ; TODO Handle control release
    lda kb_byte
    cmp #$12                                ; left shift released
    beq kbClearShifted
    cmp #$59                                ; right shift released
    beq kbClearShifted
keyboardHandleReleaseCont1:
    jmp InterruptKeyboardReturn

kbClearShifted:
    lda kb_control_byte
    and #KB_CONTROL_SHIFTED_INV
    sta kb_control_byte
    jmp keyboardHandleReleaseCont1

keyboardHandleExtended:
    lda kb_control_byte
    and #KB_CONTROL_EXTENDED_INV
    sta kb_control_byte
    ; TODO: Handle extended key
    jmp InterruptKeyboardReturn

keyboardCommandTest:
    ldx #$04
keyboardCommandTestLoop:
    cmp kbcommands,x
    beq keyboardCommandRun
    dex
    bpl keyboardCommandTestLoop
    rts

keyboardCommandRun:
    txa
    asl                                 ; *2 to get address from lookup table
    tax
    jmp (kbCommandRoutines,x)           ; Jmp to the command routine

kbcommands:
    .byte $12       ; left shift
    .byte $59       ; right shift
    .byte $14       ; left ctrl
    .byte $E0       ; extended
    .byte $F0       ; break
    ; TODO: Add right control

kbCommandRoutines:
    .word kbSetShifted
    .word kbSetShifted
    .word kbnull                        ; TODO: Handle left control
    .word kbSetExtended
    .word kbSetBreak

kbSetExtended:
    lda kb_control_byte
    ora #KB_CONTROL_EXTENDED
    sta kb_control_byte
    jmp kbnull

kbSetShifted:
    lda kb_control_byte
    ora #KB_CONTROL_SHIFTED
    sta kb_control_byte
    jmp kbnull

kbSetBreak:
    lda kb_control_byte
    ora #KB_CONTROL_RELEASE
    sta kb_control_byte
    jmp kbnull

kbnull:
    lda #$00
    rts

; Initialize Keyboard driver
InitKeyboard:
    shortr
    stz kb_control_byte
    stz kb_byte

    stz VIA1A_DIRECTION             ; read input
    lda #$82
    sta VIA1_IER

    lda #$00
    sta VIA1_PCR
    longr

    rts


