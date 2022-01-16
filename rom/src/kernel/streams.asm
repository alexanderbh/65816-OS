
NUMBER_OF_STREAMS = 3           ; Number of streams
SIZE_OF_STREAM = 16             ; Number of bytes per stream

STREAM_STDIN = 0

.SEGMENT "RAM"

StreamLookupHead:
    .res NUMBER_OF_STREAMS
StreamLookupTail:
    .res NUMBER_OF_STREAMS
StreamData:
    .res SIZE_OF_STREAM * NUMBER_OF_STREAMS

.code

; Initialize streams
; Zeroes out head, tail, data
InitStreams:
    shortr
@clrloop:
    ldx #NUMBER_OF_STREAMS
    dex
    stz StreamLookupHead, x
    stz StreamLookupTail, x
    bne @clrloop
@clrloop2:
    ldx #SIZE_OF_STREAM
    dex
    stz StreamData+SIZE_OF_STREAM, x
    stz StreamData+SIZE_OF_STREAM, x
    stz StreamData+SIZE_OF_STREAM, x
    bne @clrloop2

    longr
    rts

; Put byte to stream
; in:
;   A - byte to put
;   X - stream id
; out:
;   
StreamPutC:
shortr
    sei
    pha                         ; Save A
    phx
    ldy StreamLookupTail,x      ; fetch current tail
    phy                         ; tail onto stack

    ldy StreamLookupHead,x      ; fetch current head
    phy                         ; head onto stack

    pha
    txa

    asl                         ; *  2
    asl                         ; *  4
    asl                         ; *  8
    asl                         ; * 16
    adc 2,s                     ; + head_offset
    tax                         ; X = X * 16 + head_offset

    pla                         ; get back original A

    sta StreamData,x            ; Store byte in stream

; increment head_offset
    ply                         ; pull head from stack
    iny                         ; increment head
    tya
    
    cmp #SIZE_OF_STREAM         ; head overflow?
    bne @checktail
    lda #0
@checktail:
    sta StreamLookupHead,x      ; store head

    cmp 1,s                     ; compare with tail from stack
    bne @tailok
    pla
    adc #1
    plx
    sta StreamLookupTail,x
    jmp @done
@tailok:
    ply                         ; pull tail from stack    
    ply                         ; pull x from stack
@done:
    pla                         ; Restore A
    cli
longr
    rtl

; Get byte from stream
; in:
;   X - stream id
; out:
;   carry 1: nothing read
;   carry 0: success
;    A: read byte
StreamGetC:
shortr
    sei
    lda StreamLookupTail,x
    cmp StreamLookupHead,x
    bne @readc                  ; tail !== head
    sec                         ; set carry for: "no char to read"
    jmp @done
@readc:
    clc                         ; clear carry for success read

    pha                         ; tail on stack

    adc #1                      ; tail = tail + 1
    cmp #SIZE_OF_STREAM         ; tail === 16?
    bne @savetail               ; if not skip next
    lda #0                      ; tail = 0
@savetail:
    sta StreamLookupTail,x      ; save tail 

    txa

    asl                         ; *  2
    asl                         ; *  4
    asl                         ; *  8
    asl                         ; * 16
    adc 1,s                     ; + tail_offset
    tax                         ; X = X * 16 + tail_offset

    lda StreamData,x

    plx

@done:
    cli
longr
    rtl