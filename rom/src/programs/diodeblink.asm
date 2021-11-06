.RODATA

running_diode_1: .asciiz "\r$55"
running_diode_2: .asciiz "\r$AA"

.code

DiodeBlinkExec:
    lda #$0A
    jsl RA8875_WriteChar
DiodeBlinkLoop:
    write running_diode_1
    LDA #$FF
    STA VIA1A_DIRECTION

    LDA #$AA
    STA VIA1A

    JSR LongDelayDiode
    JSR LongDelayDiode
    JSR LongDelayDiode

    write running_diode_2


    LDA #$55
    STA VIA1A

    JSR LongDelayDiode
    JSR LongDelayDiode
    JSR LongDelayDiode

    JML DiodeBlinkLoop


LongDelayDiode:
    ldx #$FF
LongDelayDiodeLoop1:
    ldy #$FF
LongDelayDiodeLoop2:
    dey
    bne LongDelayDiodeLoop2
    dex
    bne LongDelayDiodeLoop1
    rts