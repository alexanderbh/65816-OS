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

data_loading_bracket:           .asciiz "[ -- ] "
data_ok_bracket:                .asciiz "\r[ OK ] "
data_fail_bracket:              .asciiz "\r[FAIL] "
init_kernel_streams_done:       .asciiz "KERNEL: Streams\n"
init_kernel_tasks_done:         .asciiz "KERNEL: Tasks\n"
init_kernel_interrupt_done:     .asciiz "KERNEL: Interrupts\n"
init_kernel_scheduler_done:     .asciiz "KERNEL: Scheduler\n"
.code