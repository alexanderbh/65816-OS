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

.I16
.A16
Sys_WaitForTask:
        longa
        pha
        shortr
        ldx ActiveTask                      ; current task to set to wait

        lda #TASK_STATUS_WAITING_TASK
        sta TaskStatus,x                    ; Save waiting for task status
        longa
        txa
        asl
        tax
        pla
        sta TaskWaitFor,x                   ; save the id of the task for wait for
        ldx ActiveTask
        
        shortr
    @loop:
        lda TaskStatus,x                    ; check if the task is still waiting
        cmp #TASK_STATUS_WAITING_TASK
        beq @loop

        longr
        RTL

.I16
.A16
Sys_Exit:
    jml TaskExit