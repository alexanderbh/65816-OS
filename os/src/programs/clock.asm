
.code
ClockExec:
    shortr
    lda #$00
    sta $00
@loop:
    inc $00
    BNE @lowonly    ; Branch to end if the low byte didn't roll over to 00.
    inc $01
    @lowonly:

    ;lda ClockCounter
    ;cmp #$00
    ;bne @loop
    
    ;lda ClockCounter+1
    ;jsr RA8875_WriteHex
    jmp @loop