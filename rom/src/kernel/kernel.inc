.A16
.I16
.macro write str_addr
    pea str_addr
    JSL RA8875_WriteString16
    PLA
.endmacro

.A8
.I8
.macro write_char char
    PHA
    LDA char
    JSR RA8875_WriteStringChar
    PLA
.endmacro

.RODATA

newline:                    .asciiz "\n"
init_kernel_done:           .asciiz "Init KERNEL - OK\n"
init_kernel_streams_done:   .asciiz "KERNEL: Streams - OK\n"
init_kernel_tasks_done:   .asciiz "KERNEL: Tasks - OK\n"

.code