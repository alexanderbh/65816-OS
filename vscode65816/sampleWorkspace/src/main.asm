.setcpu "65816"
.P816
.smart
.feature string_escapes

.zeropage
.include "drivers/spi/spi.zp.inc"
.include "drivers/ra8875/ra8875.zp.inc"

.RODATA

test_string: .asciiz "\n---\n"
testlen_string: .asciiz "1357abcdefgh78"

.code
.include "kernel/kernel.inc"
.include "macros/macros.inc"

.include "bios/bios.asm"
.include "kernel/kernel.asm"


.include "stdlib/stdlib.asm"

.include "programs/programs.inc"
.A8
.I8
ResetVector:
    ldx #$FF
    txs
    cld
    jsr InitBIOS                    ; Entry point for boot
    
    longr
    jsr InitKernel                  ; Kernel Init

    ;shortr
    ;write test_string

    ; longr
    ; ldx #$1234
    ; ldy #$5678
    ; lda #$9ABC
    ; jsr DumpRegs

    ; longr
    ; ldx #$EFEF
    ; ldy #$4242
    ; lda #$ABCD
    ; pha
    ; lda #$0123
    ; pha
    ; lda #$CDEF

    ; longr
    ; pla

; print break

    ;write test_string

; StrLen

    
    ; pea testlen_string				; Add parameter to stack

    ; lda #Std_StrLen
    ; jsl StdLib						; Call stdlib

	; plx								; Clean up stack
    
    ; jsl RA8875_WriteHex16			; Debug write result

; print break

    ;write test_string




; Readnum


    ; pea testlen_string				; Add parameter to stack


    ; lda #Std_ReadNum
    ; jsl StdLib						; Call stdlib

	; plx								; Clean up stack

    ; jsl RA8875_WriteHex16			; Debug write result

; print break

    ;write test_string

    shortr
    lda #$00            ; push program bank of ShellExec
    pha
    longr
    pea ShellExec       ; push 2byte addr of ShellExec

    jsl TaskSpawn
    pla
    shortr
    pla


    ;longr
    ;write test_string
    ;shortr
    ;lda TaskStatus
    ;jsl RA8875_WriteHex


    ;longr
    ;write test_string
    ;shortr

    lda TaskProgramBank
    jsl RA8875_WriteHex
    lda TaskProgramPointer
    jsl RA8875_WriteHex
    lda TaskProgramPointer+1
    jsl RA8875_WriteHex

    ;longr
    ;write test_string
    ;shortr

    lda #$00            ; push program bank of ClockExec
    pha
    longr
    pea ClockExec       ; push 2byte addr of ClockExec
    jsl TaskSpawn

    pla ; elean up 16bits

    ;write test_string
    shortr
    pla ; clean up
    
    ; debug printing of task
    ;lda TaskProgramBank+1
    ;jsl RA8875_WriteHex
    ;lda TaskProgramPointer+2
    ;jsl RA8875_WriteHex
    ;lda TaskProgramPointer+3
    ;jsl RA8875_WriteHex


    cli

    ;jsl Scheduler_NextTask
    ;jsr ShellExec                   ; Run shell program

; Blink Diode
    ;jsl LoaderExec

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
    .word ResetVector

