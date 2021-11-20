.RODATA
	strlen: .asciiz "StrLen Called\n"
	readnum: .asciiz "ReadNum Called\n"

.code


;	STRING LENGTH
; 		Return lenght of zero terminated string in A
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

	jsl RA8875_WriteHex16

	shortr
	write strlen

	longr
	
	ply
	plx
	pla

	rtl




;	READ NUMBER
; 		Return the decimal number read from 
Stdlib_ReadNum:
	clc

	shortr
	write readnum

	ldy #0
@next:
	lda (args_start,s),y
	cmp #$30
	bcc @numend						; less than $30
	cmp #$40
	bcs @numend						; more than $39
	iny
	jmp @next
@numend:
	dey
	lda (args_start,s),y
	clc
	sbc #$29
	jsl RA8875_WriteHex
	write newline
	tax



	tya
	beq @done
	dey
	lda (args_start,s),y

	clc
	sbc #$29


	jsl RA8875_WriteHex
	write newline
	jsl RA8875_WriteHex
	write newline

	jsl MulTen


	jsl RA8875_WriteHex
	write newline



@done:
	;tya
	;lda #$A6C2
	sta reg_a, s


	clc
	longr
	ply
	plx
	pla
	

	rtl


MulTen:
	phy
	asl              ;   *  2
	pha
	asl     		          ;   *  4
	asl		               ;   *  8
	clc
	adc 1,s               ;   *  9
	ply
	ply
	rtl