
.SEGMENT "RAM"

ClockCounter: .res 2

.code
.A16
.I16
ClockExec:
    shortr
    lda #$0
    sta $0
@loop:
    inc ClockCounter
    BNE @lowonly    ; Branch to end if the low byte didn't roll over to 00.
    inc ClockCounter+1
    @lowonly:


    jmp @loop

    longr
    rts