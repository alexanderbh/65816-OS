
.macro write str_addr
    PHA
    LDA #<str_addr
    STA string_ptr         ;store high byte of message address
    LDA #>str_addr
    STA string_ptr+1       ;store low byte of message address
    JSR RA8875_WriteString
    PLA
.endmacro


.macro write_char char
    PHA
    LDA char
    JSR RA8875_WriteStringChar
    PLA
.endmacro

.RODATA

newline:                .asciiz "\n"
init_kernel_done:       .asciiz "Initializing KERNEL - OK\n"

.code