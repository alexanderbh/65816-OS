.include "stdlib.inc"

.SEGMENT "STDLIB"

StdLib:
    longr
    pha
    phx
    phy

    and #$00FF 
    dec a                           ; 0 index function number
    asl a                           ; double function number to match words

    shortr
    tax

    jmp (StdLibTable,x)


StdLibTable:
    .word Stdlib_StrLen
    .word Stdlib_ReadNum


.include "strings.asm"


;    register stack frame...
;
reg_y       =1                    ;16 bit .Y
reg_x       =reg_y+2              ;16 bit .X
reg_a       =reg_x+2              ;16 bit .A
reg_rtl     =reg_a+2              ;24 bit RTL address

args_start  =reg_rtl+3         

; ARGS      $10 args_start
; RTS___    $07 reg_rts
; AAAA      $05 reg_a
; XXXX      $03 reg_x
; YYYY      $01 reg_y
;           current StackPointer