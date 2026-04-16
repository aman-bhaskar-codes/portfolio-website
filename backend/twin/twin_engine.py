from backend.twin.mode_router import detect_mode
from backend.twin.personality import get_system_prompt


def prepare_mode(req):

    mode = detect_mode(req)

    system = get_system_prompt(mode)

    return mode, system
