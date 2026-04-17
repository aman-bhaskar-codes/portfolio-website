# tests/test_health.py
import pytest
import httpx


@pytest.mark.asyncio
async def test_health_endpoint():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "tier" in data
    assert "services" in data
    assert data["tier"] <= 3, f"System degraded: tier {data['tier']}"
