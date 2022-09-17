; DIRECT PAGE LAYOUT
; $00 - $7F   : Input Buffer
; $80         : Input Buffer Index

Shell_InputBufferStart = $00
Shell_InputBufferIndex = $80

ShellExec:
        shortr
    @restart:
        stz Shell_InputBufferIndex      ; reset input buffer
        stz Shell_InputBufferStart      ; start buffer with 0-termination

        lda #'>'
        jsl RA8875_WriteChar
        lda #' '
        jsl RA8875_WriteChar


    @loop:
        ldx #STREAM_STDIN                ; TODO: Get stream from Task Context (not hardcoded stdin)
        jsl StreamGetC
        beq @loop                       ; Noting in stream (carry set)
        pha
        jsl RA8875_WriteChar            ; Write to RA8875       - todo: write to stream (from task context) - stdout
        pla
        cmp #$0A                         ; Is it LINE FEED?
        beq @execute                    ; yes - then execute input buffer

        ; store in input buffer
        ldx Shell_InputBufferIndex
        sta Shell_InputBufferStart,x
        inx
        cmp #Shell_InputBufferIndex     ; compare to #128
        bne @cnt                        ; if not overflow then continue
        stz Shell_InputBufferIndex

    @cnt:
        stz Shell_InputBufferStart,x    ; 0-terminate the end of the input buffer
        stx Shell_InputBufferIndex      ; store index
        jmp @loop
    
    @execute:
; TODO: EXECUTE string in input buffer
        longr
        tdc
        pha
        shortr

        ; PS
        pea CMD_NAME_PS
        lda #Std_StrCompareUntilWhiteSpace
        jsl StdLib
        pla
        pla
        bcs @next1


        lda #$00            ; push program bank of LoaderExec
        pha
        longr
        pea ExecPs       ; push 2byte addr of LoaderExec
        jsl TaskSpawn
        jsl RA8875_WriteHex16
        pla
        shortr
        pla ; clean up

        jmp @preparerestart
    
    @next1:

        
    @nothingfound:
        longr
        pea STR_SHELL_COMMAND_NOT_FOUND
        jsl RA8875_WriteString16
        tdc
        pha
        jsl RA8875_WriteString16
        shortr        
    @preparerestart:
        lda #$0A                        ; print new line before restart
        jsl RA8875_WriteChar

        pla
        pla
        jmp @restart

CMD_NAME_PS:                  .asciiz "ps"
CMD_NAME_ECHO:                .asciiz "echo"


STR_SHELL_COMMAND_NOT_FOUND:  .asciiz "Unknown command: "