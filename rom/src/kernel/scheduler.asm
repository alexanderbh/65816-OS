; IRQ steps
; Push to the stack:
;
;   PB  - Program Bank           - 1 byte
;   PCH - Program Counter High   - 1 byte
;   PCL - Program Counter Low    - 1 byte
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



; B000-C000 : I/O
InterruptStackY = 2+1
InterruptStackX = InterruptStackY+2
InterruptStackA = InterruptStackX+2
InterruptDP = InterruptStackA+2
InterruptDB = InterruptDP+2
InterruptStatusRegister = InterruptDB+1
InterruptPC = InterruptStatusRegister+1
InterruptPB = InterruptPC+2

.SEGMENT "KERNEL"

SchedulerCount: .res 1

KERNEL_SCHEDULER_TASK_SWITCHES: .res 2

TempStackReturnBank: .res 1
TempStackReturnPC: .res 2

NextTaskId: .res 2


.code

.A8
.I8
Scheduler_NextTask:
    inc KERNEL_SCHEDULER_TASK_SWITCHES
    BNE @lowcntSwitch    ; Branch to end if the low byte didn't roll over to 00.
    inc KERNEL_SCHEDULER_TASK_SWITCHES+1
@lowcntSwitch:

; DEBUG PRINT SERIAL
    LDA #'T'
    jsr SerialPutC 
; END: DEBUG PRINT SERIAL  


    ldx ActiveTask
    
    ; DEBUG
    txa
    clc
    adc #$30
    JSR SerialPutC
    ; END DEBUG

    lda TaskStatus,x
    cmp #TASK_STATUS_RUNNING
    bne @notrunnable

; Save the current task state
    lda #TASK_STATUS_RUNNABLE               ; if running then set to runnable
    sta TaskStatus,x
@notrunnable:
    lda InterruptDB,s
    sta TaskDataBank,x                      ; save Data Bank 

    lda InterruptPB,s
    sta TaskProgramBank,x                   ; save Program Bank

    lda InterruptStatusRegister,s
    and #%11111011                          ; make sure interrupt disable is not set
    sta TaskStatusRegister,x

    txa
    asl
    tax                                     ; double the x for 2 byte indexes

; SAVE STACK POINTER
    longa
    tsc                                     ; A = stack pointer
    clc
    adc #InterruptPB                        ; A = stack pointer - ...
    sta TaskStackPointer,x


    lda InterruptStackA,s
    sta TaskA,x
    lda InterruptStackX,s
    sta TaskX,x
    lda InterruptStackY,s
    sta TaskY,x
    
    lda InterruptPC,s
    sta TaskProgramPointer,x

    shorta

    ldx ActiveTask                          ; X is the task being interrupted
@loop:
    inx
    cpx #NUMBER_OF_TASKS
    bne @fine
    ldx #$FF     ; will roll to 0 on inx 
    jmp @loop
@fine:

    lda TaskStatus,x
    
    beq @loop                               ; 0 - means no task on this index
    
    cmp #TASK_STATUS_RUNNABLE
    beq @task_switch
    cmp #TASK_STATUS_RUNNING
    beq @goreturn                           ; some task is already running. Should not happen



    jmp @loop
@goreturn:
    jmp @return

@task_switch:


; SWITCH TO NEW TASK

    stx ActiveTask

    ; DEBUG
    lda #'N'
    JSR SerialPutC
    txa
    clc
    adc #$30
    JSR SerialPutC
    ; END DEBUG

    lda #TASK_STATUS_RUNNING               ; if running then set to runnable
    sta TaskStatus,x

    lda 1,s
    sta TempStackReturnPC+1
    lda 2,s
    sta TempStackReturnPC
    lda 3,s
    sta TempStackReturnBank
; Set up stack
    txa
    asl
    tax
    longr
    lda TaskStackPointer,x
    clc
    sbc #InterruptPB
    tcs
    shortr

    lda TempStackReturnPC+1
    sta 1,s
    lda TempStackReturnPC
    sta 2,s
    lda TempStackReturnBank
    sta 3,s

    ldx ActiveTask

    lda TaskProgramBank,x
    sta InterruptPB,s

    lda TaskDataBank,x
    sta InterruptDB,s

    lda TaskStatusRegister,x
    and #%11111011
    sta InterruptStatusRegister,s

    txa
    asl
    tax
; Set Direct Page to $9x00
    lda ActiveTask

    clc
    adc #$90                                ; A = $9x

    sta InterruptDP+1,s

; Set registers
    lda TaskA,x
    sta InterruptStackA,s
    lda TaskA+1,x
    sta InterruptStackA+1,s
    lda TaskY,x
    sta InterruptStackY,s
    lda TaskY+1,x
    sta InterruptStackY+1,s
    lda TaskX,x
    sta InterruptStackX,s
    lda TaskX+1,x
    sta InterruptStackX+1,s


    lda TaskProgramPointer+1,x
    sta InterruptPC+1,s
    

    lda TaskProgramPointer,x
    sta InterruptPC,s
    
    jmp @return


@return:
    
    rts


.A16
.I16
InitScheduler:
    
    stz KERNEL_SCHEDULER_TASK_SWITCHES        ; set task switch count to 0

    lda #$0100
    sta NextTaskId


; should be approx 256 times per second
    ;lda #$9896
    lda #$FFFF
    sta VIA1_T1CL

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

