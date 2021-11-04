.setcpu "65816"
.P816

.feature string_escapes

.SEGMENT "RAM"                      ; Trigger usage

.zeropage
.include "drivers/spi/spi.zp.inc"
.include "drivers/ra8875/ra8875.zp.inc"


.code
.include "macros/macros.inc"
.include "kernel/kernel.inc"

.include "bios/bios.asm"
.include "kernel/kernel.asm"

.include "programs/diodeblink.asm"
.include "programs/dump.asm"

ResetVector:
    jsr InitBIOS                    ; Entry point for boot
    jsr InitKernel                  ; Kernel Init



    jsr DiodeBlinkExec


.SEGMENT "VECTORS"
    .word ResetVector