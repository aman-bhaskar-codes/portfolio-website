def detect_mode(req):

    mode = req.get("mode")

    if mode:
        return mode

    query = req.get("query", "").lower()

    if "architecture" in query:
        return "twin"

    if "system" in query:
        return "twin"

    return "assistant"
