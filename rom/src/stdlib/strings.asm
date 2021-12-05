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

;	shortr
;	write strlen

	longr
	
	ply
	plx
	pla

	rtl




;	READ NUMBER
; 		Return the decimal number read from string input
Stdlib_ReadNum_StackSize = 6
Stdlib_ReadNum_SingleDigit = 1
Stdlib_ReadNum_Result = Stdlib_ReadNum_SingleDigit + 2
Stdlib_ReadNum_LoopCounter = Stdlib_ReadNum_Result + 2
Stdlib_ReadNum:
;	shortr
;	write readnum

	longr
	ldx #0
	ldy #0
	phy
	phy
	phy
@next:
	shortr
	lda (args_start+Stdlib_ReadNum_StackSize,s),y
	longr
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
	shortr
	lda (args_start+Stdlib_ReadNum_StackSize,s),y
	longr
	clc
	sbc #$2F
	sta Stdlib_ReadNum_SingleDigit,s

	lda Stdlib_ReadNum_LoopCounter,s ; how many times to multiply 10?
	tax								; save in loop counter X
@mulloop:
	txa								; look at loop counter X
	beq @donemul					; if 0 then skip multiply 10
	lda Stdlib_ReadNum_SingleDigit,s

	jsl MulTen
	sta Stdlib_ReadNum_SingleDigit,s

	dex								; derement loop counter X
	jmp @mulloop

@done:
	lda Stdlib_ReadNum_Result,s
	sta reg_a+Stdlib_ReadNum_StackSize, s

	clc

	ply ; clear temp stack
	ply ; clear temp stack
	ply ; clear temp stack

	ply
	plx
	pla
	

	rtl


@donemul:

	lda Stdlib_ReadNum_SingleDigit,s
	clc
	adc Stdlib_ReadNum_Result,s
	sta Stdlib_ReadNum_Result,s

	lda Stdlib_ReadNum_LoopCounter,s
	clc
	adc #1								; add one time multiply with 10
	sta Stdlib_ReadNum_LoopCounter,s
	jmp @numend


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