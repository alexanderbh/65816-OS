
.code

ResetVector:
Loop2:
    LDA #$01
    LDX #$FF
    LDY #$33
    LDA #$02
    LDX #$FE
    LDY #$22
    LDA #$03
    LDX #$FD
    LDY #$11
    LDA #$04
    LDX #$FC
    LDY #$00
    LDA #$05
    LDX #$FB
    LDY #$BA
    LDA #$06
    LDX #$FA
    LDY #$BE
    jmp Loop2


.SEGMENT "VECTORS"
    .word ResetVector