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

	shortr
	write strlen

	longr
	
	ply
	plx
	pla

	rtl




;	READ NUMBER
; 		Return the decimal number read from 
Stdlib_ReadNum_StackSize = 3
Stdlib_ReadNum:
	clc

	shortr
	write readnum
	ldx #0
	ldy #0
	phy
	phy
	phy
@next:
	lda (args_start+Stdlib_ReadNum_StackSize,s),y
	cmp #$30
	bcc @numend						; less than $30
	cmp #$40
	bcs @numend						; more than $39
	iny
	jmp @next
@numend:
	tya
	beq @done						; did we read 0 numbers? then end
	dey								; subtract 1 for the last number
	lda (args_start+Stdlib_ReadNum_StackSize,s),y
	clc
	sbc #$2F
	jsl RA8875_WriteHex
	write newline

	sta 1,s

	lda 3,s							; how many times to multiply 10?
	tax								; save in loop counter X
@mulloop:
	txa								; look at loop counter X
	beq @donemul					; if 0 then skip multiply 10
	lda 1,s

	jsl MulTen
	sta 1,s

	jsl RA8875_WriteHex
	write newline

	dex								; derement loop counter X
	jmp @mulloop

@donemul:

	lda 1,s
	clc
	adc 2,s
	sta 2,s

	jsl RA8875_WriteHex
	write newline

	lda 3,s
	clc
	adc #1								; add one time multiply with 10
	sta 3,s
	jmp @numend


@done:
	lda 2,s
	sta reg_a+Stdlib_ReadNum_StackSize, s


	clc

	ply ; clear temp stack
	ply ; clear temp stack
	ply ; clear temp stack
	longr
	ply
	plx
	pla
	

	rtl


MulTen:
	phy
	asl						;   *  2
	pha
	asl						;   *  4
	asl		               	;   *  8
	clc
	adc 1,s               	;   + (*2)
	ply
	ply
	rtl