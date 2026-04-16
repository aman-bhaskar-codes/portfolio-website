STOP_FLAG = False


def stop_voice():

    global STOP_FLAG
    STOP_FLAG = True


def should_stop():

    return STOP_FLAG
