.I16
.A16
Sys_GetPID:
    shorti
    LDX ActiveTask
    txa
    asl
    tax
    LDA TaskStructID,x
    longi
    RTL

.I8
.A8
Sys_Exit:
    jml Scheduler_ExitTask