.code
.A16
.I16
ExecPerf:
    shortr
    lda KERNEL_SCHEDULER_TASK_SWITCHES+1
    jsl RA8875_WriteHex
    lda KERNEL_SCHEDULER_TASK_SWITCHES
    jsl RA8875_WriteHex

    lda #$0A
    jsl RA8875_WriteChar

    lda KERNEL_INTERRUPT_TIMER_COUNTER+1
    jsl RA8875_WriteHex
    lda KERNEL_INTERRUPT_TIMER_COUNTER
    jsl RA8875_WriteHex
    longr
    jml Sys_Exit