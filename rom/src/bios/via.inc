
    .import __VIA1_START__
    .import __VIA2_START__

    VIA1B = __VIA1_START__                            ; VIA PORT B input/output register
    VIA1A = __VIA1_START__ + 1                        ; VIA PORT A input/output register
    VIA1B_DIRECTION = __VIA1_START__ + 2              ; VIA PORT B direction register is $6002
    VIA1A_DIRECTION = __VIA1_START__ + 3              ; VIA PORT A direction register is $6003
    VIA1_T1CL = __VIA1_START__ + 4                    ; Timer 1 Low order latches
    VIA1_T1CH = __VIA1_START__ + 5                    ; Timer 1 High order counter
    VIA1_ACR = __VIA1_START__ + 11                    ; Auxillary Control Register
    VIA1_IFR = __VIA1_START__ + 13                    ; Interupt Flag Register
    VIA1_IER = __VIA1_START__ + 14                    ; Interupt Enable Register

    VIA2B = __VIA2_START__                            ; VIA2 PORT B input/output register
    VIA2A = __VIA2_START__ + 1                        ; VIA2 PORT A input/output register
    VIA2B_DIRECTION = __VIA2_START__ + 2              ; VIA2 PORT B direction register is $5002
    VIA2A_DIRECTION = __VIA2_START__ + 3              ; VIA2 PORT A direction register is $5003