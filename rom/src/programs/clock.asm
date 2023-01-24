
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

    ;lda ClockCounter
    ;cmp #$00
    ;bne @loop
    
    ;lda ClockCounter+1
    ;jsr RA8875_WriteHex
    jmp @loop