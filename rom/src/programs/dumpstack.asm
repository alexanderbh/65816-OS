DumpStack:

    shortr


    lda 1,s           ;get mode
    jsl RA8875_WriteHex
    lda 2,s           ;get mode
    jsl RA8875_WriteHex
 
    lda #' '
    jsl RA8875_WriteChar

    lda 3,s           ;get mode
    jsl RA8875_WriteHex
    lda 4,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 5,s           ;get mode
    jsl RA8875_WriteHex
    lda 6,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 7,s           ;get mode
    jsl RA8875_WriteHex
    lda 8,s           ;get mode
    jsl RA8875_WriteHex


    lda #' '
    jsl RA8875_WriteChar
    

    lda 9,s           ;get mode
    jsl RA8875_WriteHex
    lda 10,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 11,s           ;get mode
    jsl RA8875_WriteHex
    lda 12,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 13,s           ;get mode
    jsl RA8875_WriteHex
    lda 14,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 15,s           ;get mode
    jsl RA8875_WriteHex
    lda 16,s           ;get mode
    jsl RA8875_WriteHex


    lda #' '
    jsl RA8875_WriteChar
    

    lda 17,s           ;get mode
    jsl RA8875_WriteHex
    lda 18,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 19,s           ;get mode
    jsl RA8875_WriteHex
    lda 20,s           ;get mode
    jsl RA8875_WriteHex
    

    rts