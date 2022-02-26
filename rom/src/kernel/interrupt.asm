.SEGMENT "RAM"

InterruptStackPointerStart: .res 2


.code

.A16
.I16
InterruptVector:
    phb                   ;save DB
    phd                   ;save DP
    longr                 ;select 16 bit registers
    pha                   ;save .C
    phx                   ;save .X
    phy                   ;save .Y

    tsc
    sta InterruptStackPointerStart

    shortr

    lda VIA1_IFR
    and VIA1_IER            ; zero those that were not allowed to pull IRQ down.
    asl ; timer 1
    bmi  InterruptTimer1
    asl ; timer 2
    asl ; cb1
    asl ; cb2
    asl ; shift reg
    asl ; ca1

    bmi InterruptKB



    jmp crti

InterruptTimer1:
    bit VIA1_T1CL
    inc TimerCounter
    BNE @lowcnt    ; Branch to end if the low byte didn't roll over to 00.
    inc TimerCounter+1
@lowcnt:
    ;lda TimerCounter+1
    ;jsr RA8875_WriteHex
    ;lda TimerCounter
    ;jsr RA8875_WriteHex

    jmp crti

InterruptKB:
    jsr InterruptKeyboard

crti:
    longr
    ply                   ;restore .Y
    plx                   ;restore .X
    pla                   ;restore .C
    pld                   ;restore DP
    plb                   ;restore DB
    rti                   ;resume foreground task
