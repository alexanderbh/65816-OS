.RODATA

running_diode_1: .asciiz "\r$55"
running_diode_2: .asciiz "\r$AA"

.code
.A16
.I16
DiodeBlinkExec:
    lda #$0A
    jsl RA8875_WriteChar16

    shortr
    LDA #$FF
    STA VIA1A_DIRECTION
    longr

DiodeBlinkLoop:

    write running_diode_1

    shortr
    LDA #$AA
    STA VIA1A

    jsr LongDelayDiode
    jsr LongDelayDiode
    jsr LongDelayDiode
    longr

    write running_diode_2

    shortr
    LDA #$55
    STA VIA1A

    jsr LongDelayDiode
    jsr LongDelayDiode
    jsr LongDelayDiode
    longr

    JML DiodeBlinkLoop

.A8
.I8
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