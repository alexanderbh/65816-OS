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

    lda  VIA1_ACR       ; Clear the ACR's bit that
    AND  #%01111111      ; tells T1 to toggle PB7 upon time-out, and
    ORA  #%01000000      ; set the bit that tells T1 to automatically
    STA  VIA1_ACR       ; produce an interrupt at every time-out and
                        ; just reload from the latches and keep going.
    LDA  #%11000000
    STA  VIA1_IER       ; Enable the T1 interrupt in the VIA.


    lda #1
    jsr PutC

    lda #$FF
    sta VIA1_T1CL
    lda #$FF
    sta VIA1_T1CH

    lda #2
    jsr PutC

    cli

    
    lda #3
    jsr PutC

@loop:

    lda #4
    jsr PutC
    jmp @loop




InitVia:
    LDA #$FF
    STA VIA2A_DIRECTION
    LDA #$FF
    STA VIA2B_DIRECTION
    LDA #$01
    STA VIA2B
    RTS


PutC:
    STA VIA2A
    DEC VIA2B
    INC VIA2B
    RTS

InterruptVector:
    lda #'I'
    jsr PutC

    lda VIA1_T1CL

    rti

.SEGMENT "RAM"

.SEGMENT "NATIVE_VECTORS"
    .word $0000                 ; COP
    .word $0000                 ; BRK
    .word $0000                 ; ABORTB
    .word $0000                 ; NMIB
    .word $0000                 ; RES
    .word InterruptVector       ; IRQB
.SEGMENT "VECTORS"
    .word ResetVector           ; RESET
    .word InterruptVector       ; IRQB
