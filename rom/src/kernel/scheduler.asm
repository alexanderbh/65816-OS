; IRQ steps
; Push to the stack:
;
;   PB - Program Bank
;   PC - Program Counter
;   SR - Status Register
;
; PB set to $00


; Stacks and direct page
; 0000-00FF : kernel direct page
; 0100-01FF : kernel stack

; 9000-90FF : task 0  - direct
; A000-A0FF : task 0  - stack
; 9F00-9FFF : task 16 - direct
; AF00-AFFF : task 16 - stack

; B000-C000 : I/O

.A8
.I8
Scheduler_NextTask:
    sei

    ldx ActiveTask
    cmp #TASK_STATUS_RUNNING
    bne @loop                           
    lda #TASK_STATUS_RUNNABLE               ; if running then set to runnable
    sta TaskStatus,x
@loop:
    inx
    cpx #NUMBER_OF_TASKS
    beq @rollover

    lda TaskStatus,x
    ;jsl RA8875_WriteHex
    beq @loop
    
    cmp #TASK_STATUS_RUNNABLE
    beq @task_switch
    cmp #TASK_STATUS_RUNNING
    beq @return

    jsl RA8875_WriteHex
    txa
    jsl RA8875_WriteHex
    longr
    write task_unknown_status
    shortr
    
    jmp @return

@task_switch:
    longr
    write task_switching_task
    shortr
    txa
    jsl RA8875_WriteHex
    jmp @return


@rollover:
    ldx #$FF     ; will roll to 0 on inx 
    jmp @loop

@return:
    

    cli
    rtl