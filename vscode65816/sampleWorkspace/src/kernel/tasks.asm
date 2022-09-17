NUMBER_OF_TASKS = 16

TASK_STATUS_NONE = 0
TASK_STATUS_RUNNING = 1
TASK_STATUS_RUNNABLE = 2
TASK_STATUS_WAITING_TASK = 3
TASK_STATUS_EXITED = 6          ; everything above this can be taken by a new task
TASK_STATUS_KILLED = 7

TASK_EXIT_CODE_KILLED = 7

.include "scheduler.asm"
.include "tasks.inc"

.SEGMENT "KERNEL"

KernelSp: .res 1
ActiveTask: .res 1
TaskStatus: .res NUMBER_OF_TASKS
TaskExitCode: .res NUMBER_OF_TASKS
TaskStackPointer: .res NUMBER_OF_TASKS * 2
TaskDataBank: .res NUMBER_OF_TASKS
TaskProgramBank: .res NUMBER_OF_TASKS
TaskProgramPointer: .res NUMBER_OF_TASKS * 2
TaskStatusRegister: .res NUMBER_OF_TASKS
TaskA: .res NUMBER_OF_TASKS * 2
TaskX: .res NUMBER_OF_TASKS * 2
TaskY: .res NUMBER_OF_TASKS * 2

; TASK STRUCTURE

TaskStructID: .res NUMBER_OF_TASKS * 2


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
        stz TaskExitCode,x
        stz TaskStatusRegister,x
        stz TaskProgramBank,x
        stz TaskDataBank,x
        longr
        stz TaskStackPointer, x
        stz TaskProgramPointer, x
        stz TaskA, x
        stz TaskX, x
        stz TaskY, x
        stz TaskStructID, x
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

    longa
        lda NextTaskId
        sta TaskStructID,x
        clc
        adc #1
        sta NextTaskId
    shorta
        stz TaskExitCode,x

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



; Find task slot not used. First try to find a slot with status 0
; if none with status 0 is found then find a exited or killed slot
; input: n/a
; output:
;   x - slot number that's empty
;   carry set if error
.A8
.I8
TaskFindUnusedTask:
        clc
        pha
        ldx #0
    @loop:
        lda TaskStatus,x
        beq @return 
        inx
        cpx #NUMBER_OF_TASKS         ; Reach end of tasks list?
        bne @loop
    ; No slot found. Try one killed or exited
        ldx #$0
    @loop2:
        lda TaskStatus,x
        cmp #TASK_STATUS_EXITED
        bcs @return
        inx
        cpx #NUMBER_OF_TASKS
        bne @loop2
        sec                         ; reached the end the second time.
                                    ; no slots available. return with carry set
    @return:
        pla
        rts



; Mark current task as exited. Go into nop-loop until
; next task is chosen by scheduler
; input:
;   A - exit code
; output: n/a
.A16
.I16
TaskExit:
        ldx ActiveTask

        sta TaskExitCode,x              ; store the exit code
        
        lda #TASK_STATUS_EXITED
        sta TaskStatus,x                ; mark the task as exited

        @loop:                          ; go into infinite loop
            nop                         ; until scheduler picks
            jmp @loop                   ; the next task



; exit task from outside the task itself
; input:
;   x - task number to kill
; output: n/a
.A16
.I16
TaskKill:    
        lda #TASK_STATUS_KILLED
        sta TaskStatus,x
        sta TaskExitCode,x

        rtl