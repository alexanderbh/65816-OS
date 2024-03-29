
NUMBER_OF_STREAMS = 3           ; Number of streams
SIZE_OF_STREAM = 16             ; Number of bytes per stream

STREAM_STDIN = 0

.SEGMENT "KERNEL"

StreamLookupHead:
    .res NUMBER_OF_STREAMS
StreamLookupTail:
    .res NUMBER_OF_STREAMS
StreamData:
    .res SIZE_OF_STREAM * NUMBER_OF_STREAMS

.code

; Initialize streams
; Zeroes out head, tail, data
.A16
.I16
InitStreams:
    shortr
    ldx #NUMBER_OF_STREAMS
@clrloop:
    dex
    stz StreamLookupHead, x
    stz StreamLookupTail, x
    
    bne @clrloop
    ldx #SIZE_OF_STREAM
@clrloop2:
    dex
    stz StreamData, x
    stz StreamData+SIZE_OF_STREAM, x
    stz StreamData+SIZE_OF_STREAM+SIZE_OF_STREAM, x


    bne @clrloop2

    longr
    rts

; Put byte to stream
; in:
;   A - byte to put
;   X - stream id
; out:
.A8
.I8  
StreamPutC:
    pha
    ldy StreamLookupTail,x      ; fetch current tail
    phy                         ; stack: [tail]

    ldy StreamLookupHead,x      ; fetch current head
    phy                         ; stack: [tail, head]

    phx                         ; stack: [tail, head, stream id]
    pha                         ; stack: [tail, head, stream id, A-byte]
    txa

    asl                         ; *  2
    asl                         ; *  4
    asl                         ; *  8
    asl                         ; * 16
    adc 3,s                     ; + head_offset
    tax                         ; X = X * 16 + head_offset

    pla                         ; stack: [tail, head, stream id], a = A-byte

    sta StreamData,x            ; Store byte in stream

; increment head_offset
    plx                         ; stack: [tail, head], x=stream id
    ply                         ; stack: [tail], y = head
    iny                         ; increment head
    tya
    
    cmp #SIZE_OF_STREAM         ; head overflow?
    bne @checktail
    lda #0
@checktail:
    sta StreamLookupHead,x      ; store head

; this is untested.
; if the stream wraps around
    cmp 1,s                     ; is head == stack[1]/tail?
    bne @tailnothead
    ply                         ; if yes increment tail
    iny
    tya
    sta StreamLookupTail,x
    jmp @done


@tailnothead:
    plx ; clear tail from stack. not used pt
@done:
    pla
    rtl

; Get byte from stream
; in:
;   X - stream id
; out:
;   A: read byte
;       0: nothing
;       x: read byte
.A8
.I8
StreamGetC:
    lda StreamLookupTail,x
    cmp StreamLookupHead,x
    bne @readc                  ; tail !== head
    lda #0                      ; set A to 0 (nothing read)
    jmp @done
@readc:

    pha                         ; s:[tail]
    clc
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
    ply                         ; s:[]

    lda StreamData,x

@done:
    rtl