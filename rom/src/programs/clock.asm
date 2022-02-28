
.A16
.I16
ClockExec:
    shortr

@loop:

    lda TimerCounter+1
    jsl RA8875_WriteHex
    lda TimerCounter
    jsl RA8875_WriteHex

    jsr LongDelay
    jsr LongDelay
    jsr LongDelay
    jsr LongDelay
    jsr LongDelay


    jmp @loop

    longr
    rts