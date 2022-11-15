.RODATA

running_diode_0: .asciiz "\r(*------)"
running_diode_1: .asciiz "\r(-*-----)"
running_diode_2: .asciiz "\r(--*----)"
running_diode_3: .asciiz "\r(---*---)"
running_diode_4: .asciiz "\r(----*--)"
running_diode_5: .asciiz "\r(-----*-)"
running_diode_6: .asciiz "\r(------*)"

.code
.A16
.I16
LoaderExec:
    lda #$0A
    jsl RA8875_WriteChar16          ; write new line
shortr
    jsl Sys_GetPID
longr
    asl
    asl
    asl
    asl
    clc
    adc #(16*13)
    sta $00
    

    lda $00
    jsl RA8875_SetTextCursorY

    jsl RA8875_WriteHex16

    lda #$0A
    jsl RA8875_WriteChar16          ; write new line
LoaderLoop:

    lda $00
    jsl RA8875_SetTextCursorY
    write running_diode_0
    jsr LongDelayLoaderExec

    lda $00
    jsl RA8875_SetTextCursorY
    write running_diode_1
    jsr LongDelayLoaderExec

    lda $00
    jsl RA8875_SetTextCursorY
    write running_diode_2
    jsr LongDelayLoaderExec

    lda $00
    jsl RA8875_SetTextCursorY
    write running_diode_3
    jsr LongDelayLoaderExec

    lda $00
    jsl RA8875_SetTextCursorY
    write running_diode_4
    jsr LongDelayLoaderExec

    lda $00
    jsl RA8875_SetTextCursorY
    write running_diode_5
    jsr LongDelayLoaderExec

    lda $00
    jsl RA8875_SetTextCursorY
    write running_diode_6
    jsr LongDelayLoaderExec

    lda $00
    jsl RA8875_SetTextCursorY
    write running_diode_5
    jsr LongDelayLoaderExec

    lda $00
    jsl RA8875_SetTextCursorY
    write running_diode_4
    jsr LongDelayLoaderExec

    lda $00
    jsl RA8875_SetTextCursorY
    write running_diode_3
    jsr LongDelayLoaderExec

    lda $00
    jsl RA8875_SetTextCursorY
    write running_diode_2
    jsr LongDelayLoaderExec
    write running_diode_1
    jsr LongDelayLoaderExec

    JML LoaderLoop

LongDelayLoaderExec:
    shortr
    jsr LogDelayLoader
    jsr LogDelayLoader
    jsr LogDelayLoader
    longr
    rts

.A8
.I8
LogDelayLoader:
    ldx #$FF
LogDelayLoaderLoop1:
    ldy #$FF
LogDelayLoaderLoop2:
    dey
    bne LogDelayLoaderLoop2
    dex
    bne LogDelayLoaderLoop1
    rts