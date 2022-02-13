
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
shortr
    sei
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

    plx ; clear tail from stack. not used pt
    cli
longr
    rtl

; Get byte from stream
; in:
;   X - stream id
; out:
;   carry 1: nothing read
;   carry 0: success
;     A: read byte
.A8
.I8
StreamGetC:
    sei
    lda StreamLookupTail,x
    cmp StreamLookupHead,x
    bne @readc                  ; tail !== head
    sec                         ; set carry for: "no char to read"
    jmp @done
@readc:

    pha                         ; tail on stack
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

    lda StreamData,x

    plx

    clc                         ; clear carry for success read
@done:
    cli
    rtl