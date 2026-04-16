FORBIDDEN = [
    "fake project",
    "unknown repo",
]


def apply_governance(text):

    for f in FORBIDDEN:
        if f in text.lower():
            return True

    return False
