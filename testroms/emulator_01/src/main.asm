
.code

ResetVector:
Loop2:
    LDA #$01
    LDA #$02
    LDA #$03
    LDA #$04
    LDA #$05
    LDA #$06
    LDA #$07
    LDA #$08
    jmp Loop2

.SEGMENT "VECTORS"
    .word ResetVector