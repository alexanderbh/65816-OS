InitKeyboard:
    shortr
    stz VIA1A_DIRECTION             ; read input
    lda #$82
    sta VIA1_IER

    lda #$00
    sta VIA1_PCR
    longr

    RTS

