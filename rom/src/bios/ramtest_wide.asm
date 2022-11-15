.RODATA

ram_test_start_wide: .asciiz "Running wide ram test"
ram_test_progress: .asciiz "."
bit16_registers: .asciiz "16 bit registers"

.code
.A16
.I16
RamTestWideRun:

    write ram_test_start_wide

    shortr
    LDA #$42
    STA $011234
    LDA #$11
    LDA $011234
    CMP #$42
    BNE RamTestFailWide
    LDA #$F6
    STA $021234
    LDA $011234
    CMP #$42
    BNE RamTestFailWide
    LDA $021234
    CMP #$F6
    BNE RamTestFailWide
    LDA #$55
    STA $031234
    LDA $011234
    CMP #$42
    BNE RamTestFailWide

    longr
    ; write ok_string
    rts

RamTestFailWide:
    longr
    write fail_string
    rts

.A16
.I16
RamTestWideRegistersRun:

    write bit16_registers

    LDA #$1234
    STA $040400
    LDA #$9876
    LDA $040400
    CMP #$1234
    BNE RamTestFailWide

    ; write ok_string

    rts