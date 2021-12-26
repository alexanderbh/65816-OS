
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

    lda VIA1_IFR
    and #%00000010
    cmp #%00000010
    beq InterruptKB
    
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
