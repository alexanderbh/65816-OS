.macro inc16 variable
    LDA variable
    CLC
    ADC #$01
    STA variable
    LDA variable+1
    ADC #$00
    STA variable+1
.endmacro