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


    ; jsl RA8875_WriteHex
    ; write space
    ; lda 7,s           ;get mode
    ; jsl RA8875_WriteHex
    ; lda 8,s           ;get mode
    ; jsl RA8875_WriteHex

    ; write space
    ; lda 9,s           ;get mode
    ; jsl RA8875_WriteHex
    ; lda 10,s           ;get mode
    ; jsl RA8875_WriteHex

    ; write space
    ; lda 11,s           ;get mode
    ; jsl RA8875_WriteHex
    ; lda 12,s           ;get mode
    ; jsl RA8875_WriteHex

    ; write test_string

    longr       ;select 16 bit registers
    clc
    tsc                   ;get SP (currently $CFEF)
    adc #s_regsf  ;add bytes in register & library stack frames
    tax

    adc #1        ;add bytes in user stack frame
    tay 

    lda #s_regsf-1
    mvp 0,0

    tya
    tcs

    ply
    plx
    pla

    rts