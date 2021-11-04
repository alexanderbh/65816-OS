.RODATA

ram_test_start: .asciiz "Running ram test"


.code

RamTestRun:
    write ram_test_start
; Single cell at $0300
    LDA #$42
    STA $0300
    LDA #$00
    LDA $0300
    CMP #$42
    BNE RamTestFail
; Single cell at $0300
    LDA #$66
    STA $9898
    LDA #$00
    LDA $9898
    CMP #$66
    BNE RamTestFail

; All of zero page
    ldx #0                ;ZP location index
    txa                   ;initialize
    sec                   ;test "bit"

loop0010:
    sta $00,x             ;clear test cell
    ldy #9                ;bit shift iterations

loop0020:
    rol $00,x             ;rotate away
    dey                   ;step counter
    bne loop0020          ;not done

    bcc RamTestFail       ;RAM defective...abort

    lda $0,x              ;any "stuck" bits?
    bne RamTestFail       ;yes, bad RAM...abort

    inx                   ;we done?
    bne loop0010          ;no, do next

    write ok_string

    RTS


RamTestFail:
    write fail_string
    RTS