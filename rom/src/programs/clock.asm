
.A16
.I16
ClockExec:
    shortr
    lda #$FF
    sta $0
@loop:
    ;lda TimerCounter+1
    ;cmp $0
    ;beq @loop

    ;lda TimerCounter+1
    ;sta $0
    ;jsl RA8875_WriteHex
    ;lda TimerCounter
    ;jsl RA8875_WriteHex

    phd
    
    lda 2,s
    jsl RA8875_WriteHex
    lda 1,s
    jsl RA8875_WriteHex
    
    pla
    pla

    jsr LongDelay
    jsr LongDelay
    jsr LongDelay
    jsr LongDelay
    jsr LongDelay
    jsr LongDelay
    jsr LongDelay
    jsr LongDelay
    jsr LongDelay
    jsr LongDelay
    jsr LongDelay
    jsr LongDelay


    jmp @loop

    longr
    rts