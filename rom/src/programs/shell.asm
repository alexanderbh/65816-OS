ShellExec:
    shortr


    lda #'>'
    jsl RA8875_WriteChar

    lda #' '
    jsl RA8875_WriteChar

    ldx STREAM_STDIN

@loop:
    jsl StreamGetC
    bcs @loop                   ; Noting in stream (carry set)
    
    jsl RA8875_WriteChar        ; Write to RA8875       - todo: write to stdout
    jmp @loop

    longr
    rtl