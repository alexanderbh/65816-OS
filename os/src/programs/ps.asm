.RODATA

Data_ps_header:                    .asciiz "ID PID  ST WPID XC"
Data_10_spaces:                     .asciiz "          "

.code
.A8
.I8
ExecPs:
    longr
        write Data_ps_header
    shortr
        ldx #$0

    @loop:
        lda TaskStatus,x
        cmp #$00
        beq @next
        
    @print:
        lda #$0A
        jsl RA8875_WriteChar
        txa
        jsl RA8875_WriteHex
        lda #' '
        jsl RA8875_WriteChar
    longa
        txy
        txa
        asl
        tax
        lda TaskStructID,x
        jsl RA8875_WriteHex16
        tyx
    shorta
        lda #' '
        jsl RA8875_WriteChar
        lda TaskStatus,x
        jsl RA8875_WriteHex
        cmp #TASK_STATUS_WAITING_TASK
        bne @nowait                           ; skip writing waiting task id

        lda #' '
        jsl RA8875_WriteChar
        txy
        txa
        asl
        tax
    longa
        lda TaskWaitFor,x
        jsl RA8875_WriteHex16
    shorta
        tyx
        lda #' '
        jsl RA8875_WriteChar

        jmp @exitcode
    @nowait:
    longr
        write Data_10_spaces+4
    shortr

    @exitcode:
        lda TaskExitCode,x
        cmp #$FF
        beq @next
        jsl RA8875_WriteHex
    @next:
        inx
        cpx #NUMBER_OF_TASKS
        beq @done
        jmp @loop
    @done:
        jml Sys_Exit