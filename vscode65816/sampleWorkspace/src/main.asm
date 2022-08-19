
.code

.include "included.asm"

ResetVector:
    LDA #$01
    JSR Add41
    LDA #$02
    LDA #$03
    LDA #$04
    LDA #$05
    LDA #$06
    LDA #$07
    LDA #$08
    jmp ResetVector

.SEGMENT "VECTORS"
    .word ResetVector