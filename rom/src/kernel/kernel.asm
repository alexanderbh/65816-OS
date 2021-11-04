
InitKernel:
    write init_kernel_done
    RTS
;;;
; Long Delay
;;;

LongDelay:
    ldx #$FF
LongDelayLoop1:
    ldy #$FF
LongDelayLoop2:
    dey
    bne LongDelayLoop2
    dex
    bne LongDelayLoop1
    rts

;;;
; Delay
;;;

Delay:
    ldx #$FF
DelayLoop1:
    ldy #$FF
DelayLoop2:
    dey
    bne DelayLoop2
    dex
    bne DelayLoop1
    rts

;;;
; Short Delay
;;;
DelayShort:	ldx #$aa
DelayShortLoop1:
	dex
    bne DelayShortLoop1
    rts
