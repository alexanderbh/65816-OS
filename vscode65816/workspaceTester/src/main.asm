.setcpu "65816"
.P816

.include "macros.inc"
.include "via.inc"
.include "spi/spi.asm"
.include "ra8875/ra8875.asm"
.include "ra8875/ra8875_api.asm"

.code

ResetVector:
    ldx #$FF
    txs
    cld

    JSR InitSPI
    JSR InitRA8875

    clc
    xce

loop:
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    nop 
    jmp loop

.A8
.I8
LongDelay:
    ldx #$FF
LongDelayLoop1:
    ldy #$FF
LongDelayLoop2:
    dey
    bne LongDelayLoop2
    dex
    bne LongDelayLoop1
    rts

.SEGMENT "RAM"

.code

.SEGMENT "VECTORS"
    .word ResetVector