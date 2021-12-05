.RODATA

running_diode_1: .asciiz "\r$55"
running_diode_2: .asciiz "\r$AA"

.code
.A16
.I16
DiodeBlinkExec:
    shortr
    lda #$0A
    jsl RA8875_WriteChar
DiodeBlinkLoop:
    write8 running_diode_1
    LDA #$FF
    STA VIA1A_DIRECTION

    LDA #$AA
    STA VIA1A

    jsr LongDelayDiode
    jsr LongDelayDiode
    jsr LongDelayDiode

    write8 running_diode_2


    LDA #$55
    STA VIA1A

    jsr LongDelayDiode
    jsr LongDelayDiode
    jsr LongDelayDiode

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