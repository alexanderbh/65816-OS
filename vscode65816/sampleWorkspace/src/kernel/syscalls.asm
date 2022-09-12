.I8
.A8
Sys_GetPID:
    LDA ActiveTask
    RTL

.I8
.A8
Sys_Exit:
    jml Scheduler_ExitTask