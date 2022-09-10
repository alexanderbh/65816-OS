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


; NOT USED! THIS IS A TEST:
; 0000-00FF : kernel direct page
; 0100-01FF : kernel stack
; 0200-02FF : task 1 DP
; 0300-03FF : task 1 stack

; B000-C000 : I/O
InterruptStackY = 3+1
InterruptStackX = InterruptStackY+2
InterruptStackA = InterruptStackX+2
InterruptDP = InterruptStackA+2
InterruptDB = InterruptDP+2
InterruptStatusRegister = InterruptDB+1
InterruptPC = InterruptStatusRegister+1
InterruptPB = InterruptPC+2

.SEGMENT "KERNEL"

SchedulerCount: .res 1

TimerCounter: .res 2
TaskSwitches: .res 2

TempStackReturnBank: .res 1
TempStackReturnPC: .res 2

.code



.A8
.I8
Scheduler_NextTask:
    sei

    ldx ActiveTask

    lda TaskStatus,x
    cmp #TASK_STATUS_RUNNING
    bne @loop

    lda #TASK_STATUS_RUNNABLE               ; if running then set to runnable
    sta TaskStatus,x

; save current task stage
    ;longr
    ;write task_save_old
    ;write test_string
    ;shortr

    ;ldx ActiveTask
    ;txa
    ;jsl RA8875_WriteHex
    ;lda #' '
    ;jsl RA8875_WriteChar
    ;lda #$A
    ;jsl RA8875_WriteChar
    ;lda #'o'
    ;jsl RA8875_WriteChar
    ;longr
    ;jsl DumpStack
    ;shortr
    ;ldx ActiveTask
    
    lda InterruptDB,s
    sta TaskDataBank,x

    lda InterruptPB,s
    sta TaskProgramBank,x

    lda InterruptStatusRegister,s
    sta TaskStatusRegister,x



    ;ldx ActiveTask
    txa
    asl
    tax

; SAVE STACK POINTER
    longa
    tsc                                 ; A = stack pointer
    clc
    adc #InterruptPB                 ; A = stack pointer - ...
    sta TaskStackPointer,x
    shorta

    ; lda TaskStackPointer+1,x 
    ; jsl RA8875_WriteHex
    ; lda #' '
    ; jsl RA8875_WriteChar
    ; lda TaskStackPointer,x
    ; jsl RA8875_WriteHex
    ; lda #' '
    ; jsl RA8875_WriteChar

    lda InterruptStackA,s
    sta TaskA,x
    lda InterruptStackA+1,s
    sta TaskA+1,x
    lda InterruptStackX,s
    sta TaskX,x
    lda InterruptStackX+1,s
    sta TaskX+1,x
    lda InterruptStackY,s
    sta TaskY,x
    lda InterruptStackY+1,s
    sta TaskY+1,x
    

    lda InterruptPC,s
    sta TaskProgramPointer,x

    ;jsl RA8875_WriteHex
    ;lda #' '
    ;jsl RA8875_WriteChar

    lda InterruptPC+1,s
    sta TaskProgramPointer+1,x

    ;jsl RA8875_WriteHex
    ;lda #$A
    ;jsl RA8875_WriteChar

    ldx ActiveTask
@loop:
    inx
    cpx #NUMBER_OF_TASKS
    bne @fine
    ldx #$FF     ; will roll to 0 on inx 
    jmp @loop
@fine:

    lda TaskStatus,x
    
    beq @loop
    
    cmp #TASK_STATUS_RUNNABLE
    beq @task_switch
    cmp #TASK_STATUS_RUNNING
    beq @goreturn

    jsl RA8875_WriteHex
    txa
    jsl RA8875_WriteHex
    longr
    write task_unknown_status
    shortr
@goreturn:
    jmp @return

@task_switch:


; SWITCH TO NEW TASK

    stx ActiveTask

 ;   lda #$A
 ;   jsl RA8875_WriteChar
 ;   lda #'s'
;    jsl RA8875_WriteChar
;    longr
;    jsl DumpStack
;    shortr


    ;longr
    ;write task_switching_task
    ;shortr

    ;ldx ActiveTask
    ;txa
    ;jsl RA8875_WriteHex
    ;lda #' '
    ;jsl RA8875_WriteChar

    ;ldx ActiveTask

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
    sta InterruptStatusRegister,s

    txa
    asl
    tax
; Set Direct Page to $9x00
    lda ActiveTask
;longr
    clc
    adc #$90                                ; A = $9x
;    xba
;    tcd
    sta InterruptDP+1,s
;shortr
    ;jsl RA8875_WriteHex

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
    ;jsl RA8875_WriteHex

    lda TaskProgramPointer,x
    sta InterruptPC,s
    ;jsl RA8875_WriteHex

    ;lda #$A
    ;jsl RA8875_WriteChar

    ;lda #'n'
    ;jsl RA8875_WriteChar
    ;longr
    ;jsl DumpStack
    ;shortr
    ;lda #$A
    ;jsl RA8875_WriteChar
    jmp @return


@return:
    

    cli
    rtl


.A16
.I16
InitScheduler:
    
    stz TimerCounter        ; set interrupt timer counter to 0
    stz TaskSwitches        ; set task switch count to 0

; should be approx 256 times per second
    lda #9896
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
