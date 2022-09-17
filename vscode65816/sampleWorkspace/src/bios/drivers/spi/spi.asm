.SEGMENT "KERNEL"
    spi_byte_out:               .res 1
    spi_byte_in:                .res 1
    spi_selected_device:        .res 1

.code
.A8
.I8
SPI_VIA = VIA1B

; prepares spi VIA PORT A for input output
InitSPI:
    LDA #$47
    STA VIA1B_DIRECTION
    LDA #$00
    STA SPI_VIA
    RTS

; select device for spi communication
SpiDeviceSelect:
    STA spi_selected_device
    LDA SPI_VIA
    RTS

; deselect spi device
SpiDeviceDeselect:
    STZ spi_selected_device
    STZ SPI_VIA
    RTS


; Transmit one byte SPI data. Remember to select SPI device with SpiDeviceSelect
; in:
;   A - byte to send over SPI
; out:
;   A - byte received over SPI

SpiByte:
    STA spi_byte_out                            ; store 
    STZ spi_byte_in
    LDX #8
    LDA spi_selected_device
spibytelp:
    ASL spi_byte_out	                        ; (5) shift MSB in to carry
    BCC spibyte1
    ORA #$40                                    ; set MOSI if MSB set
spibyte1:
    STA SPI_VIA	                                ; output (MOSI    SCS low   SCLK low)

    LDA spi_selected_device                     ; set A to selected device bit (Do it here for delay reasons)
    INC SPI_VIA                                 ; toggle clock high (SCLK is bit 0)

    CLC                                         ; clear C (Not affected by bit)
    BIT SPI_VIA                                 ; copy MISO (bit 7) in to N (and MOSI in to V)
    BPL spibyte2
    SEC		                                    ; set C is MISO bit is set (i.e. N)
spibyte2:
    ROL spi_byte_in		                        ; copy C (i.e. MISO bit) in to bit 0 of result
    DEC SPI_VIA                                 ; toggle clock low (SCLK is bit 0)

    DEX
    BNE spibytelp;
    LDA spi_byte_in	                            ; load result into A
    RTS