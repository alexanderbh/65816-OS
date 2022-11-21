.setcpu "65816"
.P816
.smart

.include "macros.inc"
.include "via.inc"

.code

ResetVector:
    clc
    xce

    jsr InitVia

    LDA #'O'
    STA VIA2A

    LDA #$00
    STA VIA2B

    LDA #$01
    STA VIA2B

    lda #'H'
    jsr PutC
    lda #'u'
    jsr PutC
    lda #'n'
    jsr PutC
    lda #'g'
    jsr PutC
@loop:
    jmp @loop

InitVia:
    LDA #$FF
    STA VIA2A_DIRECTION
    LDA #$FF
    STA VIA2B_DIRECTION
    LDA #$01
    STA VIA2B

    LDA #'D'
    STA VIA2A

    LDA #$00
    STA VIA2B

    LDA #$01
    STA VIA2B

    LDA #'A'
    STA VIA2A

    LDA #$00
    STA VIA2B

    LDA #$01
    STA VIA2B

    ldx #$FF
@memtest1:
    txa
    sta $00,X
    lda #$00
    lda $00,X
    STA VIA2A

    LDA #$00
    STA VIA2B

    LDA #$01
    STA VIA2B

    dex
    bne @memtest1




    RTS
    
PutC:

    LDA #'T'
    STA VIA2A

    LDA #$00
    STA VIA2B

    LDA #$01
    STA VIA2B

    STA VIA2A
    LDA #$00
    STA VIA2B
    lda #$01
    sta VIA2B
    RTS


.SEGMENT "RAM"

.SEGMENT "VECTORS"
    .word ResetVector