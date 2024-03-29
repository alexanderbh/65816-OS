.SEGMENT "KERNEL"
KERNEL_INTERRUPT_TIMER_COUNTER: .res 2

.code

.A16
.I16
InitInterrupt:

    stz KERNEL_INTERRUPT_TIMER_COUNTER        ; set interrupt timer counter to 0
    rts

.A16
.I16
InterruptVector:
    phb                   ;save DB - data bank
    phd                   ;save DP - direct page
    longr                 ;select 16 bit registers
    pha                   ;save .C
    phx                   ;save .X
    phy                   ;save .Y

    shortr

    LDA #'B'
    jsr SerialPutC

    lda VIA1_IFR
    and VIA1_IER            ; zero those that were not allowed to pull IRQ down.
    asl ; timer 1
    bmi  InterruptTimer1
    asl ; timer 2
    asl ; cb1
    asl ; cb2
    asl ; shift reg
    asl ; ca1

    bmi InterruptKB



    jmp crti

InterruptTimer1:
    inc KERNEL_INTERRUPT_TIMER_COUNTER
    BNE @lowcnt    ; Branch to end if the low byte didn't roll over to 00.
    inc KERNEL_INTERRUPT_TIMER_COUNTER+1
@lowcnt:
    
    LDA #'S'
    jsr SerialPutC
    jsr Scheduler_NextTask

    jmp crti

InterruptKB:
    LDA #'K'
    jsr SerialPutC
    
    jsr InterruptKeyboard

crti:
    bit VIA1A
    bit VIA1_T1CL

    LDA #'E'
    jsr SerialPutC
    longr
    ply                   ;restore .Y
    plx                   ;restore .X
    pla                   ;restore .C
    pld                   ;restore DP
    plb                   ;restore DB
    rti                   ;resume foreground task
