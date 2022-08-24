
.code

.include "included.asm"

ResetVector:
    LDA #$01
    STA $08
    JSR Add41
    LDA Counter
    ADC #$01
    STA Counter
    LDA #$04
    LDA #$05
    LDA #$06
    LDA #$07
    JSR PostIncl
    LDA #$08
    jmp ResetVector

.SEGMENT "RAM"
    Counter: .res 2
    
.code

.include "postincl.asm"

.SEGMENT "VECTORS"
    .word ResetVector