.code
.A8
.I8
InitUSB245R:
    LDA #$FF
    STA VIA2A_DIRECTION
    LDA #$FF
    STA VIA2B_DIRECTION
    LDA #$01
    STA VIA2B
    RTS
    
.A8
.I8
SerialPutC:
    STA VIA2A
    DEC VIA2B
    INC VIA2B
    RTS