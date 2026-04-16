def reward(score: float) -> bool:
    """Determines if the reflection score meets the meta-learning threshold."""
    return score > 0.7
