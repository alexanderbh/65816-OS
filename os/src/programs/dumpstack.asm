.I16
.A16
DumpStack:
    shortr
  ;  lda 1,s           ;get mode
  ;  jsl RA8875_WriteHex
  ;  lda 2,s           ;get mode
  ;  jsl RA8875_WriteHex
 
  ;  lda #' '
  ;  jsl RA8875_WriteChar

    ;lda #$A
    ;jsl RA8875_WriteChar

    longr
    tsc
    clc
    adc #4
    jsl RA8875_WriteHex16
    shortr
    lda #' '
    jsl RA8875_WriteChar

    longr
    tsc
    clc
    adc #6
    jsl RA8875_WriteHex16
    shortr
    lda #' '
    jsl RA8875_WriteChar

    longr
    tsc
    clc
    adc #8
    jsl RA8875_WriteHex16
    shortr
    lda #' '
    jsl RA8875_WriteChar


    longr
    tsc
    clc
    adc #10
    jsl RA8875_WriteHex16
    shortr
    lda #' '
    jsl RA8875_WriteChar



    longr
    tsc
    clc
    adc #12
    jsl RA8875_WriteHex16
    shortr
    lda #' '
    jsl RA8875_WriteChar
    longr
    tsc
    clc
    adc #14
    jsl RA8875_WriteHex16
    shortr
    lda #' '
    jsl RA8875_WriteChar

    longr
    tsc
    clc
    adc #16
    jsl RA8875_WriteHex16
    shortr
    lda #' '
    jsl RA8875_WriteChar

    longr
    tsc
    clc
    adc #18
    jsl RA8875_WriteHex16
    shortr
    lda #' '
    jsl RA8875_WriteChar

    longr
    tsc
    clc
    adc #20
    jsl RA8875_WriteHex16
    shortr
    lda #' '
    jsl RA8875_WriteChar

    lda #$A
    jsl RA8875_WriteChar

; Skip the first two as they are DumpStack return
    lda 4,s           ;get mode
    jsl RA8875_WriteHex
    lda 5,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 6,s           ;get mode
    jsl RA8875_WriteHex
    lda 7,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 8,s           ;get mode
    jsl RA8875_WriteHex
    lda 9,s           ;get mode
    jsl RA8875_WriteHex


    lda #' '
    jsl RA8875_WriteChar
    

    lda 10,s           ;get mode
    jsl RA8875_WriteHex
    lda 11,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 12,s           ;get mode
    jsl RA8875_WriteHex
    lda 13,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 14,s           ;get mode
    jsl RA8875_WriteHex
    lda 15,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 16,s           ;get mode
    jsl RA8875_WriteHex
    lda 17,s           ;get mode
    jsl RA8875_WriteHex


    lda #' '
    jsl RA8875_WriteChar
    

    lda 18,s           ;get mode
    jsl RA8875_WriteHex
    lda 19,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 20,s           ;get mode
    jsl RA8875_WriteHex
    lda 21,s           ;get mode
    jsl RA8875_WriteHex

    lda #' '
    jsl RA8875_WriteChar
    

    lda 22,s           ;get mode
    jsl RA8875_WriteHex
    lda 23,s           ;get mode
    jsl RA8875_WriteHex
    
    lda #' '
    jsl RA8875_WriteChar
    

    lda 24,s           ;get mode
    jsl RA8875_WriteHex
    lda 25,s           ;get mode
    jsl RA8875_WriteHex


    lda #' '
    jsl RA8875_WriteChar
    

    lda 26,s           ;get mode
    jsl RA8875_WriteHex
    lda 27,s           ;get mode
    jsl RA8875_WriteHex

    lda #$A
    jsl RA8875_WriteChar
    
    longr
    rtl