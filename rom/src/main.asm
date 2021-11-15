.setcpu "65816"
.P816
.smart -
.feature string_escapes

.SEGMENT "RAM"                      ; Trigger usage

.zeropage
.include "drivers/spi/spi.zp.inc"
.include "drivers/ra8875/ra8875.zp.inc"

.RODATA

test_string: .asciiz "\n---\n"
space: .asciiz " "

.code
.include "macros/macros.inc"
.include "kernel/kernel.inc"

.include "bios/bios.asm"
.include "kernel/kernel.asm"

.include "programs/diodeblink.asm"
.include "programs/dump.asm"
.include "programs/dumpstack.asm"
.include "programs/dumpregs.asm"

ResetVector:
    jsr InitBIOS                    ; Entry point for boot
    jsr InitKernel                  ; Kernel Init

    jsr Dummy
    shortr
    write test_string

    longr
    ldx #$1234
    ldy #$5678
    lda #$9ABC
    jsr DumpRegs

    longr
    ldx #$EFEF
    ldy #$4242
    lda #$ABCD
    pha
    lda #$0123
    pha
    lda #$CDEF
    jsr DumpStack
    pla
    pla


    shortr

    jsr DiodeBlinkExec

Dummy:
    rts


.SEGMENT "VECTORS"
    .word ResetVector


;    register stack frame...
;
reg_y    =1                    ;16 bit .Y
reg_x    =reg_y+2              ;16 bit .X
reg_a    =reg_x+2              ;16 bit .A
reg_sr   =reg_a+2              ;8 bit SR
reg_pc   =reg_sr+1             ;16 bit PC
reg_pb   =reg_pc+2             ;8 bit PB
s_regsf  =reg_pb+1-reg_y       ;register stack frame size in bytes

;
;
;    user stack frame...
;
hexarg    =s_regsf+2            ;file creation mode
