NUMBER_OF_TASKS = 16

TASK_STATUS_NONE = 0
TASK_STATUS_RUNNING = 1
TASK_STATUS_RUNNABLE = 2

.include "scheduler.asm"
.include "tasks.inc"

.SEGMENT "RAM"

KernelSp: .res 0
ActiveTask: .res 0
TaskStatus: .res NUMBER_OF_TASKS
TaskStackPointer: .res NUMBER_OF_TASKS * 2
TaskA: .res NUMBER_OF_TASKS * 2
TaskX: .res NUMBER_OF_TASKS * 2
TaskY: .res NUMBER_OF_TASKS * 2

.SEGMENT "TASK"
; marked as used


.code

; Initialize tasks
.A16
.I16
InitTasks:
    shortr
    ldx #NUMBER_OF_TASKS
@clrloop:
    dex
    stz TaskStatus, x
    longr
    stz TaskStackPointer, x
    stz TaskA, x
    stz TaskX, x
    stz TaskY, x
    shortr
bne @clrloop

    stz ActiveTask
    
    longr
    rts

; Spawn a new task

TaskSpawnArg_Addr = 1+3      ; jsl 3 bytes return
.A16
.I16
TaskSpawn:
    pha
    phx
    phy
    shortr
    jsr TaskFindUnusedTask
    bcs @no_unused_tasks

    txa
    jsl RA8875_WriteHex

    txa
    clc
    adc #$A0
    pha                                 ; s:[$A{X}], X = 0-F
    sta TaskStackPointer,x
    lda #$FF-$4                          ; needs 4 elements on the new stack
    sta TaskStackPointer+1,x

    ldy #$FF
    lda TaskSpawnArg_Addr,s
    sta (1,s),y

    iny
    lda TaskSpawnArg_Addr+1,s
    sta (1,s),y

    iny
    lda TaskSpawnArg_Addr+2,s
    sta (1,s),y

    iny
    lda #$00                            ; Status register
    sta (1,s),y

    pla                                 ; s:[]
    
    stz TaskA,x
    stz TaskX,x
    stz TaskY,x

    lda #TASK_STATUS_RUNNABLE
    sta TaskStatus,x

    jmp @return

@no_unused_tasks:
    longr
    write task_no_free_slot
    jmp @return
@return:
    longr
    ply
    plx
    pla
    rtl

; Find task slot no used
; slot returned in x
; carry set if error
.A8
.I8
TaskFindUnusedTask:
    pha
    ldx #0
@loop:
    lda TaskStatus,x
    beq @found 
    inx
    cpx #NUMBER_OF_TASKS         ; Reach end of tasks list?
bne @loop
    sec
    jmp @return
@found:
    clc
@return:
    pla
    rts