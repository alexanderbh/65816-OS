.code

TaskPrinterExec:
shortr
    jsl Sys_GetPID
    sta $00
   
@loop:

    lda $00
    jsl RA8875_WriteHex
    jsr LongDelayTaskPrinterExec

    JML @loop

LongDelayTaskPrinterExec:
    jsr LogDelayTaskPrinter
    jsr LogDelayTaskPrinter
    jsr LogDelayTaskPrinter
    rts

.A8
.I8
LogDelayTaskPrinter:
    ldx #$FF
LogDelayTaskPrinterLoop1:
    ldy #$FF
LogDelayTaskPrinterLoop2:
    dey
    bne LogDelayTaskPrinterLoop2
    dex
    bne LogDelayTaskPrinterLoop1
    rts