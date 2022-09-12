
.code
.A8
.I8
ExecPs:
    shortr

    jsl Sys_GetPID
    sta $00
   

    lda $00
    jsl RA8875_WriteHex

    jml Sys_Exit