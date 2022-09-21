; DIRECT PAGE LAYOUT
; $00 - $7F   : Input Buffer
; $80         : Input Buffer Index
; $81         : Is Daemon task

Shell_InputBufferStart = $00
Shell_InputBufferIndex = $80
Shell_IsDaemonTask = $81

ShellExec:
        shortr
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
; See if this is a daemon task
        shortr

        stz Shell_IsDaemonTask
        ldx Shell_InputBufferIndex
        dex
        lda $00,x
        cmp #'&'
        bne @notdaemon

        lda #$01
        sta Shell_IsDaemonTask

    @notdaemon:
        longr
        tdc
        pha                 ; put diract page start on stack for string search
       
        ldx #$0000            ; push program bank of any program (all 0 for now)

        ; PS
        lda #CMD_NAME_PS
        pha
        lda #Std_StrCompareUntilWhiteSpace
        jsl StdLib
        bcs @next1
        lda #ExecPs
        jsr ShellSpawnTask
        jmp @preparerestart

    @next1:
        lda #CMD_NAME_ECHO
        sta 2,s
        lda #Std_StrCompareUntilWhiteSpace
        jsl StdLib
        bcs @next2
        lda #ExecEcho
        jsr ShellSpawnTask
        jmp @preparerestart

    @next2:
        
    @nothingfound:
        pea STR_SHELL_COMMAND_NOT_FOUND
        jsl RA8875_WriteString16
        tdc
        pha
        jsl RA8875_WriteString16     
    @preparerestart:
        shortr
        lda #$0A                        ; print new line before restart
        jsl RA8875_WriteChar

        jmp ShellExec

.A16
.I16
; Spawn a task with the address in A and the bank in X
ShellSpawnTask:
        phx
        pha
        jsl TaskSpawn
        ldx Shell_IsDaemonTask
        bne @nowait
        jsl Sys_WaitForTask
    @nowait:
        pla
        pla ; clean up

        rts

CMD_NAME_PS:                  .asciiz "ps"
CMD_NAME_ECHO:                .asciiz "echo"


STR_SHELL_COMMAND_NOT_FOUND:  .asciiz "Unknown command: "