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

        jmp @loop
    
    @execute:
; TODO: EXECUTE string in input buffer

        ;lda #00                         ; put start of input buffer on stack
        ;pha
        ;pha

        jmp @restart