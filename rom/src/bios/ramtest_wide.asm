.RODATA

ram_test_start_wide: .asciiz "Running wide ram test"
ram_test_progress: .asciiz "."
bit16_registers: .asciiz "16 bit registers"

.code

RamTestWideRun:

    write ram_test_start_wide
    LDA #$42
    STA $011234
    LDA #$11
    LDA $011234
    CMP #$42
    BNE RamTestFailWide
    write ram_test_progress
    LDA #$F6
    STA $021234
    LDA $011234
    CMP #$42
    BNE RamTestFailWide
    write ram_test_progress
    LDA $021234
    CMP #$F6
    BNE RamTestFailWide
    write ram_test_progress
    LDA #$55
    STA $031234
    LDA $011234
    CMP #$42
    BNE RamTestFailWide

    write ok_string
    rts

RamTestFailWide:
    write fail_string
    rts

RamTestWideRegistersRun:

    write bit16_registers
    longr
    LDA #$1234
    STA $040400
    LDA #$9876
    LDA $040400
    CMP #$1234
    BNE RamTestFailWide
    shortr
    write ok_string

    rts