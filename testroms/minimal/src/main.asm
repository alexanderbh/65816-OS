
    .import __VIA1_START__
    .import __VIA2_START__

    VIA1B = __VIA1_START__                            ; VIA PORT B input/output register
    VIA1A = __VIA1_START__ + 1                        ; VIA PORT A input/output register
    VIA1B_DIRECTION = __VIA1_START__ + 2              ; VIA PORT B direction register is $6002
    VIA1A_DIRECTION = __VIA1_START__ + 3              ; VIA PORT A direction register is $6003
    
.code

ResetVector:
    LDA #$FF
    STA VIA1B_DIRECTION
Loop2:
    LDA #$FF
    STA VIA1B
    jmp Loop2

.SEGMENT "VECTORS"
    .word ResetVector