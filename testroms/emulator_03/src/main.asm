
.code

ResetVector:
    LDA #$BA
    STA $04
    LDA #$BE
    STA $05
Loop2:
    LDA $04
    ADC #$01
    STA $04
    jmp Loop2


.SEGMENT "VECTORS"
    .word ResetVector