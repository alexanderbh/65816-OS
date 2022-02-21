.A8
.I8
DumpRegs:
    longr
    pha
    phx
    phy

    shortr

    lda #'A'
    jsl RA8875_WriteChar
    lda #':'
    jsl RA8875_WriteChar
    lda #' '
    jsl RA8875_WriteChar
    lda 6,s           ;get mode
    jsl RA8875_WriteHex
    lda 5,s           ;get mode
    jsl RA8875_WriteHex
    lda #$0A
    jsl RA8875_WriteChar


    lda #'Y'
    jsl RA8875_WriteChar
    lda #':'
    jsl RA8875_WriteChar
    lda #' '
    jsl RA8875_WriteChar
    lda 2,s           ;get mode
    jsl RA8875_WriteHex
    lda 1,s           ;get mode
    jsl RA8875_WriteHex
    lda #$0A
    jsl RA8875_WriteChar

    lda #'X'
    jsl RA8875_WriteChar
    lda #':'
    jsl RA8875_WriteChar
    lda #' '
    jsl RA8875_WriteChar
    lda 4,s           ;get mode
    jsl RA8875_WriteHex
    lda 3,s           ;get mode
    jsl RA8875_WriteHex
    lda #$0A
    jsl RA8875_WriteChar



    longr       ;select 16 bit registers
  
    ply
    plx
    pla

    rts