ShellExec:
    shortr


    lda #'>'
    jsl RA8875_WriteChar

    lda #' '
    jsl RA8875_WriteChar


@loop:
    ldx STREAM_STDIN
    jsl StreamGetC
    beq @loop                   ; Noting in stream (carry set)
    
    jsl RA8875_WriteChar        ; Write to RA8875       - todo: write to stdout
    jmp @loop

    longr
    rtl