
.A16
.I16
InterruptVector:
    phb                   ;save DB
    phd                   ;save DP
    longr                 ;select 16 bit registers
    pha                   ;save .C
    phx                   ;save .X
    phy                   ;save .Y
    ; write intstr

    ;LDA VIA1_IFR
    ;AND #%00000010
    ;CMP #%00000010
    ;BEQ IntKeyboardInterrupt
    ;JMP IntKeyboardInterrupt
    shortr
    lda VIA1A
    jsl RA8875_WriteHex
    lda #$0A
    jsl RA8875_WriteChar
    bit VIA1A
    longr

crti:
    longr
    ply                   ;restore .Y
    plx                   ;restore .X
    pla                   ;restore .C
    pld                   ;restore DP
    plb                   ;restore DB
    rti                   ;resume foreground task
