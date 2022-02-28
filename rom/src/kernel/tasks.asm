NUMBER_OF_TASKS = 16

TASK_STATUS_NONE = 0
TASK_STATUS_RUNNING = 1
TASK_STATUS_RUNNABLE = 2

.include "scheduler.asm"
.include "tasks.inc"

.SEGMENT "RAM"

KernelSp: .res 1
ActiveTask: .res 1
TaskStatus: .res NUMBER_OF_TASKS
TaskStackPointer: .res NUMBER_OF_TASKS * 2
TaskDataBank: .res NUMBER_OF_TASKS
TaskProgramBank: .res NUMBER_OF_TASKS
TaskProgramPointer: .res NUMBER_OF_TASKS * 2
TaskStatusRegister: .res NUMBER_OF_TASKS
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
    stz TaskStatus,x
    stz TaskStatusRegister,x
    stz TaskProgramBank,x
    stz TaskDataBank,x
    longr
    stz TaskStackPointer, x
    stz TaskProgramPointer, x
    stz TaskA, x
    stz TaskX, x
    stz TaskY, x
    shortr
bne @clrloop

    lda #$FF
    sta ActiveTask
    
    longr
    rts

; Spawn a new task

TaskSpawnArg_Addr = 1+3+6      ; jsl 3 bytes return
.A16
.I16
TaskSpawn:
    pha
    phx
    phy
    shortr
    jsr TaskFindUnusedTask
    bcs @no_unused_tasks

    ;txa
    ;jsl RA8875_WriteHex


    lda #TASK_STATUS_RUNNABLE
    sta TaskStatus,x

    lda TaskSpawnArg_Addr+2,s
    sta TaskProgramBank,x

    txa
    tay
    asl
    tax
    tya
    clc
    adc #$A0
    sta TaskStackPointer+1,x
    lda #$FF
    sta TaskStackPointer,x            ; Stack pointer: $AxFF


    lda TaskSpawnArg_Addr,s
    sta TaskProgramPointer,x

    lda TaskSpawnArg_Addr+1,s
    sta TaskProgramPointer+1,x


    stz TaskA,x
    stz TaskA+1,x
    stz TaskY,x
    stz TaskY+1,x
    stz TaskX,x
    stz TaskX+1,x


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