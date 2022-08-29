.setcpu "65816"
.P816

.code

.include "included.asm"
.include "macros.inc"

ResetVector:
    clc
    xce
    LDA #$01
    rep #$20
    .A16
    LDA #$ABCD
    sep #$20
    LDA Counter
    CLC
    ADC #$01
    STA Counter
    LDA Counter+1
    ADC #$00
    STA Counter+1
    JSR Add41
    LDA #$04
    LDA #$05
    inc16 Counter
    LDA #$06
    LDA #$07
    inc16 CounterB
    JSR PostIncl
    LDA #$08
    jmp ResetVector

.SEGMENT "RAM"
    Counter: .res 2
    CounterB: .res 2
    
.code

.include "postincl.asm"

.SEGMENT "VECTORS"
    .word ResetVector