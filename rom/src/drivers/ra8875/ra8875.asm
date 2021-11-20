    .include "ra8875.inc"

; Write Data  destroy A
; in
;   A - Data
RA8875WriteData:
    PHA
    LDA #SPI_DEVICE_RA8875
    JSR SpiDeviceSelect
    LDA #RA8875_DATAWRITE
    JSR SpiByte
    PLA
    JSR SpiByte
    JSR SpiDeviceDeselect
    RTS

; Write Command  destroy A
; in
;   A - Data
RA8875WriteCommand:
    PHA
    LDA #SPI_DEVICE_RA8875
    JSR SpiDeviceSelect
    LDA #RA8875_CMDWRITE
    JSR SpiByte
    PLA
    JSR SpiByte
    JSR SpiDeviceDeselect
    RTS

; Read Command  destroy A
; in
;   A - Register to read
; out
;   A - Data from register
RA8875ReadCommand:
    JSR RA8875WriteCommand
    LDA #SPI_DEVICE_RA8875
    JSR SpiDeviceSelect
    LDA #RA8875_DATAREAD
    JSR SpiByte
    JSR SpiByte
    JSR SpiDeviceDeselect
    RTS

; Initialize the RA8875  destroy AX
InitRA8875:

; PLL settings
    LDA #RA8875_PLLC1
    JSR RA8875WriteCommand
    LDA #(RA8875_PLLC1_PLLDIV1+10)
    JSR RA8875WriteData

    JSR LongDelay

    LDA #RA8875_PLLC2
    JSR RA8875WriteCommand
    LDA #RA8875_PLLC2_DIV4
    JSR RA8875WriteData

    JSR LongDelay
; Color mode  MCU size
    LDA #RA8875_SYSR
    JSR RA8875WriteCommand
    ; For 16 bit color
    ; LDA #(RA8875_SYSR_16BPP | RA8875_SYSR_MCU8)
    LDA #(RA8875_SYSR_8BPP | RA8875_SYSR_MCU8)
    JSR RA8875WriteData

    JSR LongDelay

; Pixel clock
    LDA #RA8875_PCSR
    JSR RA8875WriteCommand
    LDA #(RA8875_PCSR_PDATL | RA8875_PCSR_2CLK)
    JSR RA8875WriteData

    JSR LongDelay

; Horizontal settings
    LDA #RA8875_HDWR
    JSR RA8875WriteCommand
    LDA #((RA8875_WIDTH / 8) - 1)
    JSR RA8875WriteData

    LDA #RA8875_HNDFTR
    JSR RA8875WriteCommand
    LDA #(RA8875_HNDFTR_DE_HIGH + RA8875_hsync_finetune)
    JSR RA8875WriteData

    LDA #RA8875_HNDR
    JSR RA8875WriteCommand
    LDA #((RA8875_hsync_nondisp - RA8875_hsync_finetune - 2) / 8)
    JSR RA8875WriteData

    LDA #RA8875_HSTR
    JSR RA8875WriteCommand
    LDA #((RA8875_hsync_start / 8) - 1)
    JSR RA8875WriteData

    LDA #RA8875_HPWR
    JSR RA8875WriteCommand
    LDA #(RA8875_HPWR_LOW + ((RA8875_hsync_pw / 8) - 1))
    JSR RA8875WriteData

; Vertical settings
    LDA #RA8875_VDHR0
    JSR RA8875WriteCommand
    LDA #((RA8875_HEIGHT - 1) & $FF)
    JSR RA8875WriteData

    LDA #RA8875_VDHR1
    JSR RA8875WriteCommand
    LDA #((RA8875_HEIGHT - 1) >> 8)
    JSR RA8875WriteData

    LDA #RA8875_VNDR0
    JSR RA8875WriteCommand
    LDA #(RA8875_vsync_nondisp - 1)
    JSR RA8875WriteData

    LDA #RA8875_VNDR1
    JSR RA8875WriteCommand
    LDA #(RA8875_vsync_nondisp >> 8)
    JSR RA8875WriteData

    LDA #RA8875_VSTR0
    JSR RA8875WriteCommand
    LDA #(RA8875_vsync_start - 1)
    JSR RA8875WriteData

    LDA #RA8875_VSTR1
    JSR RA8875WriteCommand
    LDA #(RA8875_vsync_start >> 8)
    JSR RA8875WriteData

    LDA #RA8875_VPWR
    JSR RA8875WriteCommand
    LDA #(RA8875_VPWR_LOW + RA8875_vsync_pw - 1)
    JSR RA8875WriteData

; Set active window X

    LDA #RA8875_HSAW0
    JSR RA8875WriteCommand
    LDA #0
    JSR RA8875WriteData

    LDA #RA8875_HSAW1
    JSR RA8875WriteCommand
    LDA #0
    JSR RA8875WriteData

    LDA #RA8875_HEAW0
    JSR RA8875WriteCommand
    LDA #((RA8875_WIDTH - 1) & $FF)
    JSR RA8875WriteData

    LDA #RA8875_HEAW1
    JSR RA8875WriteCommand
    LDA #((RA8875_WIDTH - 1) >> 8)
    JSR RA8875WriteData

; Set active window Y

    LDA #RA8875_VSAW0
    JSR RA8875WriteCommand
    LDA #0
    JSR RA8875WriteData

    LDA #RA8875_VSAW1
    JSR RA8875WriteCommand
    LDA #0
    JSR RA8875WriteData

    LDA #RA8875_VEAW0
    JSR RA8875WriteCommand
    LDA #((RA8875_HEIGHT - 1) & $FF)
    JSR RA8875WriteData

    LDA #RA8875_VEAW1
    JSR RA8875WriteCommand
    LDA #((RA8875_HEIGHT - 1) >> 8)
    JSR RA8875WriteData

; Clear entire screen

    LDA #RA8875_MCLR
    JSR RA8875WriteCommand
    LDA #(RA8875_MCLR_START | RA8875_MCLR_FULL)
    JSR RA8875WriteData

    JSR LongDelay

; Display on
    LDA #RA8875_PWRR
    JSR RA8875WriteCommand

    LDA #(RA8875_PWRR_NORMAL | RA8875_PWRR_DISPON)
    JSR RA8875WriteData

; GPIOX on    enable tft
    LDA #RA8875_GPIOX
    JSR RA8875WriteCommand
    LDA #1
    JSR RA8875WriteData


; PWM1 Config backlight
    LDA #RA8875_P1CR
    JSR RA8875WriteCommand
    LDA #(RA8875_P1CR_ENABLE | (RA8875_PWM_CLK_DIV1024 & $F))
    JSR RA8875WriteData

; Backlight clock
    LDA #RA8875_P1DCR
    JSR RA8875WriteCommand
    LDA #255
    JSR RA8875WriteData

; Set text mode
    JSR RA8875_TextMode

    STZ cursor_x

    STZ cursor_x + 1

    STZ cursor_y

    STZ cursor_y + 1

    JSR RA8875_SetTextCursor

    LDA #$FF
    JSR RA8875_SetForegroundColor

    RTS

RA8875_CursorBlink:

    LDA #RA8875_MWCR0
    JSR RA8875WriteCommand

    LDA #(RA8875_MWCR0_TXTMODE | RA8875_MWCR0_CURSOR)
    JSR RA8875WriteData

    LDA #RA8875_MWCR0
    JSR RA8875WriteCommand

    LDA #(RA8875_MWCR0_TXTMODE | RA8875_MWCR0_CURSOR | RA8875_MWCR0_BLINK)
    JSR RA8875WriteData

    LDA #RA8875_BTCR
    JSR RA8875WriteCommand

    LDA #32                        ; Blink rate 1-255 1 is fast
    JSR RA8875WriteData

    RTS

RA8875_CursorHide:

    LDA #RA8875_MWCR0
    JSR RA8875WriteCommand

    LDA #RA8875_MWCR0_TXTMODE
    JSR RA8875WriteData

    RTS

RA8875_GetTextCursorX:
    LDA #RA8875_F_CURXH
    JSR RA8875ReadCommand
    STA cursor_x+1

    LDA #RA8875_F_CURXL
    JSR RA8875ReadCommand
    STA cursor_x

    RTS

RA8875_GetTextCursorY:
    LDA #RA8875_F_CURYH
    JSR RA8875ReadCommand
    STA cursor_y+1

    LDA #RA8875_F_CURYL
    JSR RA8875ReadCommand
    STA cursor_y
    
    RTS

RA8875_SetTextCursor:
    LDA #RA8875_F_CURXL
    JSR RA8875WriteCommand
    LDA cursor_x
    JSR RA8875WriteData

    LDA #RA8875_F_CURXH
    JSR RA8875WriteCommand
    LDA cursor_x+1
    JSR RA8875WriteData


    LDA #RA8875_F_CURYL
    JSR RA8875WriteCommand
    LDA cursor_y
    JSR RA8875WriteData

    LDA #RA8875_F_CURYH
    JSR RA8875WriteCommand
    LDA cursor_y+1
    JSR RA8875WriteData

    RTS


RA8875_TextMode:
    LDA #RA8875_MWCR0
    JSR RA8875WriteCommand

    LDA #RA8875_MWCR0_TXTMODE
    JSR RA8875WriteData

; select internal font
    LDA #RA8875_FNCR0
    JSR RA8875WriteCommand
     
    LDA #0
    JSR RA8875WriteData

    RTS

RA8875_SetForegroundColor:
    PHA
    PHA
        ; writeCommand(0x63);
        ; writeData((foreColor & 0xf800) >> 11);
        ; writeCommand(0x64);
        ; writeData((foreColor & 0x07e0) >> 5);
        ; writeCommand(0x65);
        ; writeData((foreColor & 0x001f)); 
    LDA #RA8875_FGCR2
    JSR RA8875WriteCommand

    PLA
    JSR RA8875WriteData

    LDA #RA8875_FGCR1
    JSR RA8875WriteCommand
    
    PLA
    lsr
    lsr
    PHA

    JSR RA8875WriteData

    LDA #RA8875_FGCR0
    JSR RA8875WriteCommand
    
    PLA

    lsr
    lsr
    lsr

    JSR RA8875WriteData

    RTS

RA8875_WriteString:
    PHA                            ;save A, Y to stack
    PHY
    LDY #$00
    LDA #RA8875_MRWC
    JSR RA8875WriteCommand          ; write to memory write register
RA8875_WriteString0:
    LDA (string_ptr),Y
    BEQ RA8875_WriteStringEnd       ; Is char 0 then end write

    JSR RA8875_SingleChar           ; Handle single character

RA8875_WriteStringNext:
    INY
    BNE RA8875_WriteString0
RA8875_WriteStringEnd:
    PLY
    PLA
    RTL

RA8875_WriteChar:
    PHA
    BEQ RA8875_WriteCharEnd         ; Is char 0 then end write
    PHA
    LDA #RA8875_MRWC
    JSR RA8875WriteCommand

    PLA
    JSR RA8875_SingleChar           ; handle single character
RA8875_WriteCharEnd:
    PLA
    RTL

; Handle a single char that can be line feed or carraige return
RA8875_SingleChar:
    CMP #$0A                         ; Compare to 0x0A   line feed
    BNE @check_1                     ; != 0x0A
    JSR RA8875_ControlLineFeed       ; Handle as line feed
    JMP skip_write                   ; Do not print
@check_1:
    CMP #$0D                         ; Compare to 0D   carriage return
    BNE @check_2                      ; != 0x0D
    JSR RA8875_ControlCarriageReturn ; handle as carriage return
    JMP skip_write                   ; Do not print
@check_2:
    CMP #$1B                         ; Compare to 1B   escape
    BNE RA8875_WriteStringChar       ; != 0x1B
    JSR RA8875_ControlEscape         ; handle as escape sequence
    JMP skip_write                   ; Do not print

RA8875_WriteStringChar:
    JSR RA8875WriteData
skip_write:
    RTS

RA8875_ControlLineFeed:
    STZ cursor_x                    ; Control char LINE FEED
    STZ cursor_x+1
    JSR RA8875_GetTextCursorY
    CLC
    ADC #16
    STA cursor_y
    LDA cursor_y+1
    ADC #$00
    STA cursor_y+1
    ; TODO: It overflows here. Needs two bytes to handle cursor value
    JSR RA8875_SetTextCursor
    LDA #RA8875_MRWC
    JSR RA8875WriteCommand          ; write to memory write register
    RTS

RA8875_ControlCarriageReturn:
    STZ cursor_x                    ; Control char LINE FEED
    STZ cursor_x+1
    JSR RA8875_GetTextCursorY
    JSR RA8875_SetTextCursor
    LDA #RA8875_MRWC
    JSR RA8875WriteCommand          ; write to memory write register
    RTS

RA8875_ControlEscape:
    INY                             ; Look at next character
    LDA (string_ptr),Y
    BEQ RA8875_WriteStringEnd
    CMP #$5B                        ; CSI look for [
    BNE SkipControl
    INY                             ; Next char
    LDA (string_ptr),Y
    ; Read digit at a time and make into base 10 number? how

SkipControl:
    RTS

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


RA8875_WriteHex:
    PHA                     ; Save A for LSD.
    LSR
    LSR
    LSR                     ; MSD to LSD position.
    LSR
    JSL RA8875_WriteHex1    ; Output hex digit.
    PLA                     ; Restore A.
RA8875_WriteHex1:
    PHA
    AND #$0F                ; Mask LSD for hex print.
    ORA #$30                ; Add "0".
    CMP #$3A                ; Digit?
    BCC RA8875_WriteHex2    ; Yes, output it.
    ADC #$06                ; Add offset for letter.
RA8875_WriteHex2:
    JSL RA8875_WriteChar
    PLA
    RTL                    ; Return.


RA8875_WriteHex16:
    shortr
    xba                     ; switch high and low A
    jsl RA8875_WriteHex     ; print first byte
    xba                     ; switch high and low A
    jmp RA8875_WriteHex     ; print second byte
    