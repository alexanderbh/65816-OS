.A16
.I16
RA8875_WriteString16_ARG = 8
RA8875_WriteString16:
    PHY
    PHX
    shortr
    LDY #$00
    LDA #RA8875_MRWC
    JSR RA8875WriteCommand          ; write to memory write register
RA8875_WriteString16_0:
    LDA (RA8875_WriteString16_ARG,s),Y
    BEQ RA8875_WriteStringEnd16       ; Is char 0 then end write

    JSR RA8875_SingleChar           ; Handle single character

    INY
    BNE RA8875_WriteString16_0
RA8875_WriteStringEnd16:
    longr
    PLX
    PLY
    RTL

.A8
.I8
RA8875_WriteChar:
    PHX
    BEQ RA8875_WriteCharEnd         ; Is char 0 then end write
    PHA
    LDA #RA8875_MRWC
    JSR RA8875WriteCommand
    PLA
    JSR RA8875_SingleChar           ; handle single character
RA8875_WriteCharEnd:
    PLX
    RTL

.A16
.I16
RA8875_WriteChar16:
    BEQ RA8875_WriteChar16End         ; Is char 0 then end write
    PHA
    shortr
    LDA #RA8875_MRWC
    JSR RA8875WriteCommand
    longr
    PLA
    shortr
    JSR RA8875_SingleChar           ; handle single character
    longr
RA8875_WriteChar16End:
    RTL

.A8
.I8
RA8875_WriteNumber:
    LDX #$FF
    SEC                             ; Prepare for subtraction
RA8875_WriteNumber100:
    INX
    SBC #100
    BCS RA8875_WriteNumber100       ; Count how many 100s
    ADC #100
    JSR RA8875_WriteDigit           ; Print the 100s
    LDX #$FF
    SEC                             ; Prepare for subtraction
RA8875_WriteNumber10:
    INX
    SBC #10
    BCS RA8875_WriteNumber10         ; Count how many 10s
    ADC #10
    JSR RA8875_WriteDigit            ; Print the 10s
    TAX                              ; Pass 1s into X
RA8875_WriteDigit:
    PHA
    TXA                             ; Save A pass digit to A
    ORA #$30                        ; ASCII 0
    JSL RA8875_WriteChar            ; Convert to character and print it
    PLA
    RTS                             ; Restore A and return

.A8
.I8
RA8875_WriteHex:
    PHA                     ; Save A for LSD.
    LSR
    LSR
    LSR                     ; MSD to LSD position.
    LSR
    JSL RA8875_WriteHex1    ; Output hex digit.
    PLA                     ; Restore A.
RA8875_WriteHex1:
    PHX
    PHA
    CLC
    AND #$0F                ; Mask LSD for hex print.
    ORA #$30                ; Add "0".
    CMP #$3A                ; Digit?
    BCC RA8875_WriteHex2    ; Yes, output it.
    ADC #$06                ; Add offset for letter.
RA8875_WriteHex2:
    JSL RA8875_WriteChar
    PLA
    PLX
    RTL                    ; Return.

.A16
.I16
RA8875_WriteHex16:
    shortr
    xba                     ; switch high and low A
    jsl RA8875_WriteHex     ; print first byte
    xba                     ; switch high and low A
    jsl RA8875_WriteHex     ; print second byte
    longr
    RTL



; CURSOR


.A16
.I16
; takes 16 bit value in A and sets as cursor X
RA8875_SetTextCursorX:
    SEI
    PHA
    PHA
shortr
    LDA #RA8875_F_CURXL
    JSR RA8875WriteCommand
longr
    PLA
shortr
    JSR RA8875WriteData

    LDA #RA8875_F_CURXH
    JSR RA8875WriteCommand
longr
    PLA
    XBA
shortr
    JSR RA8875WriteData
longr
    CLI
    RTL


.A16
.I16
RA8875_SetTextCursorY:
    SEI
    PHA
    PHA
shortr
    LDA #RA8875_F_CURYL
    JSR RA8875WriteCommand
longr
    PLA
shortr
    JSR RA8875WriteData

    LDA #RA8875_F_CURYH
    JSR RA8875WriteCommand
longr
    PLA
    XBA
shortr
    JSR RA8875WriteData
longr
    CLI
    RTL
