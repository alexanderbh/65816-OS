; IRQ steps
; Push to the stack:
;
;   PB  - Program Bank           - 1 byte
;   PCH - Program Counter High   - 1 bytes
;   PCL - Program Counter Low    - 1 bytes
;   SR  - Status Register        - 1 byte
;
; PB set to $00


; Stacks and direct page
; 0000-00FF : kernel direct page
; 0100-01FF : kernel stack

; 9000-90FF : task 0  - direct
; A000-A0FF : task 0  - stack
; 9F00-9FFF : task 16 - direct
; AF00-AFFF : task 16 - stack



; 0000-00FF : kernel direct page
; 0100-01FF : kernel stack
; 0200-02FF : task 1 DP
; 0300-03FF : task 1 stack

; B000-C000 : I/O


.SEGMENT "RAM"

TimerCounter: .res 2

.code

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


.A16
.I16
InitScheduler:
    
    stz TimerCounter   ; set interrupt timer counter to 0

    lda #$FFFF
    sta VIA1_T1CL
    ;lda #$FF
    ;sta VIA1_T1CH

    shortr
    lda  VIA1_ACR       ; Clear the ACR's bit that
    AND  #%01111111      ; tells T1 to toggle PB7 upon time-out, and
    ORA  #%01000000      ; set the bit that tells T1 to automatically
    STA  VIA1_ACR       ; produce an interrupt at every time-out and
                        ; just reload from the latches and keep going.
    LDA  #%11000000
    STA  VIA1_IER       ; Enable the T1 interrupt in the VIA.

    longr
    rts
