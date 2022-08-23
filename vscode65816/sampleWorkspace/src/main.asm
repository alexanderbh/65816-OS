
.code

.include "included.asm"

ResetVector:
    LDA #$01
    STA $08
    JSR Add41
    LDA $02
    LDA $08
    LDA #$04
    LDA #$05
    LDA #$06
    LDA #$07
    JSR PostIncl
    LDA #$08
    jmp ResetVector

.SEGMENT "RAM"
    .byte 0
    
.code

.include "postincl.asm"

.SEGMENT "VECTORS"
    .word ResetVector