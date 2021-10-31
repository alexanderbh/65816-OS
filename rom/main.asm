.setcpu "65816"

.import __VIA1_START__

VIA1B = __VIA1_START__                          ; VIA PORT B input/output register
VIA1A = __VIA1_START__ + 1                        ; VIA PORT A input/output register
VIA1B_DIRECTION = __VIA1_START__ + 2              ; VIA PORT B direction register is $6002
VIA1A_DIRECTION = __VIA1_START__ + 3


.SEGMENT "RAM"

.code


ResetVector:

    LDA #$FF
    STA VIA1A_DIRECTION

    LDA #$AA
    STA VIA1A

    JSR LongDelay


    LDA #$55
    STA VIA1A

    JSR LongDelay

    JMP ResetVector


LongDelay:
    ldx #$FF
LongDelayLoop1:
    ldy #$FF
LongDelayLoop2:
    dey
    bne LongDelayLoop2
    dex
    bne LongDelayLoop1
    rts

    
.SEGMENT "VECTORS"
    .word ResetVector