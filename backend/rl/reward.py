def reward(answer):
    s = 0.5
    if len(answer) > 50:
        s += 0.1
    if "not sure" in answer.lower():
        s -= 0.2
    if "source" in answer.lower():
        s += 0.2
    return s
