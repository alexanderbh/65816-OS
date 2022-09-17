
.code
.A8
.I8
ExecPs:
    longr
        jsl Sys_GetPID
        sta $00
        lda $00
        jsl RA8875_WriteHex16
    shortr
        jml Sys_Exit