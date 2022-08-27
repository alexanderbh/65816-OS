
.code

.include "included.asm"

ResetVector:
    LDA #$01
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