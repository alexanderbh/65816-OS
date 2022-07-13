
.code

ResetVector:
Loop2:
    LDA $00
    LDA $01
    LDA $02
    LDA $03
    LDA $04
    LDA $05
    jmp Loop2


.SEGMENT "VECTORS"
    .word ResetVector