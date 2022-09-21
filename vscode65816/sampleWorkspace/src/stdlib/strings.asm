.RODATA
	strlen: .asciiz "StrLen Called\n"
	readnum: .asciiz "ReadNum Called\n"

.SEGMENT "STDLIB"


;	STRING LENGTH
; 		Return lenght of zero terminated string in A
;	Input:
;		stack: 2 bytes string address (0 terminated)
;	Output:
;		A: length of the string
.A16
.I16
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



.A16
.I16
;	READ NUMBER
; 		Return the decimal number read from string input
Stdlib_ReadNum_StackSize = 6
Stdlib_ReadNum_SingleDigit = 1
Stdlib_ReadNum_Result = Stdlib_ReadNum_SingleDigit + 2
Stdlib_ReadNum_LoopCounter = Stdlib_ReadNum_Result + 2
Stdlib_ReadNum:
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

		longr
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



; Compare the first token of string1 (delimited by whitespace) against string2
; in:
;    string1  - string tokenized by space
;    string2  - string to compare first token of string1 against
; example:
;    first:  time test\0
;    second: time\0
;    This is a match
; out:
;   carry set if no match
;	carry clear if match
.A16
.I16
StdLib_StrCompareUntilWhiteSpace_Arg_String2 = args_start
StdLib_StrCompareUntilWhiteSpace_Arg_String1 = args_start + 2
StdLib_StrCompareUntilWhiteSpace:
		shortr
		clc
		ldy #$00
	@strcmp_token_load:
		lda (StdLib_StrCompareUntilWhiteSpace_Arg_String1,s), Y
		cmp #$20                                ; is whitespace?
		beq @strcmp_token_is_second_done		; yes then check if string2 is done
		cmp #$0                                 ; is end of string?
		beq @strcmp_token_is_second_done		; yes then check if string2 is done
		cmp (StdLib_StrCompareUntilWhiteSpace_Arg_String2,s), Y
		bne @strcmp_token_notequal				; is it equal to string2?
		INY
		CMP #0
		BNE @strcmp_token_load
		jmp @return

	@strcmp_token_is_second_done:
		lda (StdLib_StrCompareUntilWhiteSpace_Arg_String2,s), Y
		cmp #0									; is string2 done?
		beq @return								; yes then return match
		jmp @strcmp_token_notequal				; no then return no match
	@strcmp_token_notequal:
		sec
	@return:
		longr
		ply
		plx
		pla
		rtl
		