(define memories
  '((memory LoRAM (address (#x4000 . #x8fff))
            (section stack data zdata data heap))
    (memory LoCODE (address (#x9000 . #xefff))
            (section code cdata data_init_table idata))
    (memory FarRAM1 (address (#x10000 . #x1ffff))
            (section zfar far zhuge huge))
    (memory DirectPage (address (#x0000 . #x00ff))
            (section (registers ztiny)))
    (memory Vector (address (#xfff0 . #xffff))
            (section (reset #xfffc)))
    (block stack (size #x0100))
    (block heap (size #x1000))
    (base-address _DirectPageStart DirectPage 0)
    ))