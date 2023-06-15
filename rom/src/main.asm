.setcpu "65816"
.P816
.smart
.feature string_escapes

.RODATA

.code
.include "kernel/kernel.inc"
.include "macros/macros.inc"

.include "bios/bios.asm"
.include "kernel/kernel.asm"


.include "stdlib/stdlib.asm"

.include "programs/programs.inc"
.A8
.I8
ResetVector:            ; Entry point for boot
    ldx #$FF
    txs
    cld
    jsr InitBIOS                    
    
    longr
    jsr InitKernel                  ; Kernel Init

    shortr

    lda #$0A
    jsl RA8875_WriteChar



    lda #$00            ; push program bank of ShellExec
    pha
    longr
    pea ShellExec       ; push 2byte addr of ShellExec
    jsl TaskSpawn
    pla
    shortr
    pla



    lda #$00            ; push program bank of ClockExec
    pha
    longr
    pea ClockExec       ; push 2byte addr of ClockExec
    jsl TaskSpawn
    pla
    shortr
    pla ; clean up






    

    ; lda #$00            ; push program bank of LoaderExec
    ; pha
    ; longr
    ; pea TaskPrinterExec       ; push 2byte addr of LoaderExec
    ; jsl TaskSpawn
    ; pla
    ; shortr
    ; pla ; clean up


    ; lda #$00            ; push program bank of LoaderExec
    ; pha
    ; longr
    ; pea TaskPrinterExec       ; push 2byte addr of LoaderExec
    ; jsl TaskSpawn
    ; pla
    ; shortr
    ; pla ; clean up

    ; lda #$00            ; push program bank of LoaderExec
    ; pha
    ; longr
    ; pea TaskPrinterExec       ; push 2byte addr of LoaderExec
    ; jsl TaskSpawn
    ; pla
    ; shortr
    ; pla ; clean up

    ; lda #$00            ; push program bank of LoaderExec
    ; pha
    ; longr
    ; pea TaskPrinterExec       ; push 2byte addr of LoaderExec
    ; jsl TaskSpawn
    ; pla
    ; shortr
    ; pla ; clean up
    

    cli
Loop:
    jmp Loop

.SEGMENT "NATIVE_VECTORS"
    .word $0000                 ; COP
    .word $0000                 ; BRK
    .word $0000                 ; ABORTB
    .word $0000                 ; NMIB
    .word $0000                 ; RES
    .word InterruptVector       ; IRQB
.SEGMENT "VECTORS"
    .word ResetVector           ; RESET
    .word InterruptVector       ; IRQB

