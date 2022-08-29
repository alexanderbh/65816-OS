SPI_DEVICE_RA8875 = $04

RA8875_DATAWRITE = $00
RA8875_DATAREAD = $40
RA8875_CMDWRITE = $80

RA8875_SYSR = $10
RA8875_SYSR_8BPP = $00
RA8875_SYSR_16BPP = $0C
RA8875_SYSR_MCU8 = $00

RA8875_PLLC1 = $88
RA8875_PLLC1_PLLDIV2 = $80
RA8875_PLLC1_PLLDIV1 = $00

RA8875_PLLC2 = $89
RA8875_PLLC2_DIV4 = $02

RA8875_PCSR = $04
RA8875_PCSR_PDATL = $80
RA8875_PCSR_2CLK = $01

RA8875_HDWR = $14
RA8875_HNDFTR = $15
RA8875_HNDFTR_DE_HIGH = $00
RA8875_HNDR = $16
RA8875_HSTR = $17
RA8875_HPWR = $18
RA8875_HPWR_LOW = $00

RA8875_VDHR0 = $19
RA8875_VDHR1 = $1A
RA8875_VNDR0 = $1B
RA8875_VNDR1 = $1C
RA8875_VSTR0 = $1D
RA8875_VSTR1 = $1E
RA8875_VPWR = $1F
RA8875_VPWR_LOW = $00

RA8875_HSAW0 = $30
RA8875_HSAW1 = $31
RA8875_HEAW0 = $34
RA8875_HEAW1 = $35

RA8875_VSAW0 = $32
RA8875_VSAW1 = $33
RA8875_VEAW0 = $36
RA8875_VEAW1 = $37

RA8875_FGCR0 = $63
RA8875_FGCR1 = $64
RA8875_FGCR2 = $65

RA8875_MCLR = $8E
RA8875_MCLR_START = $80
RA8875_MCLR_FULL = $00

RA8875_PWRR = $01
RA8875_PWRR_NORMAL = $00
RA8875_PWRR_DISPON = $80

RA8875_P1CR = $8A
RA8875_P1CR_ENABLE = $80
RA8875_PWM_CLK_DIV1024 = $0A
RA8875_PWM_CLK_DIV8 = $03

RA8875_P1DCR = $8B

RA8875_MWCR0 = $40
RA8875_MWCR0_TXTMODE = $80

RA8875_MWCR0_CURSOR = $40
RA8875_MWCR0_BLINK = $20

RA8875_F_CURXL = $2A
RA8875_F_CURXH = $2B
RA8875_F_CURYL = $2C
RA8875_F_CURYH = $2D

RA8875_BTCR = $44

RA8875_FNCR0 = $21

RA8875_MRWC = $02

RA8875_GPIOX = $C7


RA8875_WIDTH = 800
RA8875_HEIGHT = 480
RA8875_hsync_nondisp = 26
RA8875_hsync_start = 32
RA8875_hsync_pw = 96
RA8875_hsync_finetune = 0
RA8875_vsync_nondisp = 32
RA8875_vsync_start = 23
RA8875_vsync_pw = 2

RA_1 = $20
RA_2 = $21