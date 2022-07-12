
.code

ResetVector:
Loop2:
    LDA #$00
    ADC #$60
    ADC #$60
    ADC #$60
    ADC #$60
    jmp Loop2


.SEGMENT "VECTORS"
    .word ResetVector