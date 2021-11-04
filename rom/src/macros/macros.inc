; bmn
;       Block move macro

.macro  bmn     len,from,to
        lda     #len-1
        ldx     #(from & $FFFF)
        ldy     #(to   & $FFFF)
        mvn     (from & $FF0000),(to & $FF0000)
.endmacro


;   Register Size Macros
;   ————————————————————————————————————————————————————————————————————
;   These macros are a convenient way to change the MPU's register sizes
;   without having to remember the correct bit pattern for the REP & SEP
;   instructions.  The assembler itself has no awareness of whether 8 or
;   16 bit immediate mode operands are to be used.   Therefore, it is up
;   to the programmer to use the appropriate instructions, & to be aware
;   at all times of the MPU's register sizes.
;   ————————————————————————————————————————————————————————————————————
;
.macro  longa                ;16 bit accumulator & memory
        rep #$20
.endmacro
;
.macro  longr                ;16 bit all registers
        rep #$30
.A16
.I16
.endmacro
;
.macro  longx              ;16 bit index registers
        rep #$10
.endmacro
;
.macro  shorta                ;8 bit accumulator & memory
        sep #$20
.endmacro
;
.macro  shorti                ;8 bit index registers
        sep #$10
.endmacro
;
.macro  shortr                ;8 bit all registers
        sep #$30
.A8
.I8
.endmacro
;
.macro  shortx                ;8 bit index registers
        sep #$10
.endmacro