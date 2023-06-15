.RODATA

Data_echo_tmp:                    .asciiz "ECHOECHO"

.code
.A8
.I8
ExecEcho:
    longr
    write Data_echo_tmp

    jml Sys_Exit