.RODATA
    strlen: .asciiz "StrLen Called\n"
    readnum: .asciiz "ReadNum Called\n"

.code


Stdlib_StrLen:
    clc
    
    shortr
    
   
    ldy #0
@next:
    lda (args_start,s),y
    beq @result
    iny
    jmp @next
@result:
    tya
    sta reg_a, s

    write strlen


    longr
    
    ply
    plx
    pla

    rtl

Stdlib_ReadNum:
    shortr
    write readnum

    longr
    lda #$A6C2
    sta reg_a, s

    ply
    plx
    pla
    

    rtl
