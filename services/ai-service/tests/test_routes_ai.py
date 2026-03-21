"""Tests for AI routes — sync endpoints, async endpoints, and job status."""

from unittest.mock import AsyncMock, patch


# ── Sync endpoints ────────────────────────────────────────


class TestTranslate:
    def test_success(self, client, auth_headers):
        with patch(
            "app.routes.ai.claude.translate_item",
            new=AsyncMock(return_value={"name_translated": "牛奶", "notes": ""}),
        ):
            resp = client.post(
                "/api/v1/ai/translate",
                json={"name_en": "Milk", "target_language": "Chinese"},
                headers=auth_headers,
            )
        assert resp.status_code == 200
        assert resp.json()["name_translated"] == "牛奶"

    def test_missing_field(self, client, auth_headers):
        resp = client.post(
            "/api/v1/ai/translate",
            json={"name_en": "Milk"},  # missing target_language
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_unauthenticated(self, client):
        resp = client.post(
            "/api/v1/ai/translate",
            json={"name_en": "Milk", "target_language": "Chinese"},
        )
        assert resp.status_code == 403

    def test_invalid_token(self, client, bad_auth_headers):
        resp = client.post(
            "/api/v1/ai/translate",
            json={"name_en": "Milk", "target_language": "Chinese"},
            headers=bad_auth_headers,
        )
        assert resp.status_code == 401


class TestItemInfo:
    def test_success(self, client, auth_headers):
        mock_result = {
            "category": "Dairy",
            "typical_unit": "liter",
            "storage_tip": "Keep refrigerated",
            "nutrition_note": "High in calcium",
        }
        with patch(
            "app.routes.ai.claude.item_info", new=AsyncMock(return_value=mock_result)
        ):
            resp = client.post(
                "/api/v1/ai/item-info",
                json={"name_en": "Milk"},
                headers=auth_headers,
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["category"] == "Dairy"
        assert data["typical_unit"] == "liter"

    def test_missing_name(self, client, auth_headers):
        resp = client.post("/api/v1/ai/item-info", json={}, headers=auth_headers)
        assert resp.status_code == 422

    def test_unauthenticated(self, client):
        resp = client.post("/api/v1/ai/item-info", json={"name_en": "Milk"})
        assert resp.status_code == 403


class TestAlternatives:
    def test_success(self, client, auth_headers):
        mock_result = {"alternatives": [{"name": "Oat Milk", "reason": "dairy-free"}]}
        with patch(
            "app.routes.ai.claude.alternatives", new=AsyncMock(return_value=mock_result)
        ):
            resp = client.post(
                "/api/v1/ai/alternatives",
                json={"name_en": "Milk", "reason": "dairy free"},
                headers=auth_headers,
            )
        assert resp.status_code == 200
        assert len(resp.json()["alternatives"]) == 1

    def test_no_reason(self, client, auth_headers):
        mock_result = {"alternatives": []}
        with patch(
            "app.routes.ai.claude.alternatives", new=AsyncMock(return_value=mock_result)
        ):
            resp = client.post(
                "/api/v1/ai/alternatives",
                json={"name_en": "Milk"},
                headers=auth_headers,
            )
        assert resp.status_code == 200


# ── Async endpoints ───────────────────────────────────────


class TestSuggest:
    def test_returns_job_id(self, client, auth_headers):
        with patch(
            "app.routes.ai.queue.publish_job", new=AsyncMock(return_value="job-abc-123")
        ):
            resp = client.post(
                "/api/v1/ai/suggest",
                json={"sections": {"Produce": ["Apples", "Bananas"]}},
                headers=auth_headers,
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["job_id"] == "job-abc-123"
        assert data["status"] == "queued"

    def test_unauthenticated(self, client):
        resp = client.post(
            "/api/v1/ai/suggest",
            json={"sections": {}},
        )
        assert resp.status_code == 403


class TestInspire:
    def test_returns_job_id(self, client, auth_headers):
        with patch(
            "app.routes.ai.queue.publish_job", new=AsyncMock(return_value="job-xyz-456")
        ):
            resp = client.post(
                "/api/v1/ai/inspire",
                json={"sections": {"Produce": ["Apples"]}, "preferences": "vegan"},
                headers=auth_headers,
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["job_id"] == "job-xyz-456"
        assert data["status"] == "queued"

    def test_no_preferences(self, client, auth_headers):
        with patch(
            "app.routes.ai.queue.publish_job", new=AsyncMock(return_value="job-001")
        ):
            resp = client.post(
                "/api/v1/ai/inspire",
                json={"sections": {}},
                headers=auth_headers,
            )
        assert resp.status_code == 200


# ── Job status ────────────────────────────────────────────


class TestGetJob:
    def test_pending(self, client, auth_headers):
        with patch("app.routes.ai.cache.cache_get", new=AsyncMock(return_value=None)):
            resp = client.get("/api/v1/ai/jobs/job-123", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "pending"
        assert data["job_id"] == "job-123"

    def test_done_with_json_result(self, client, auth_headers):
        import json

        result = json.dumps(
            {
                "suggestions": [
                    {"name_en": "Bread", "category": "Bakery", "reason": "staple"}
                ]
            }
        )
        with patch("app.routes.ai.cache.cache_get", new=AsyncMock(return_value=result)):
            resp = client.get("/api/v1/ai/jobs/job-456", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "done"
        assert data["result"]["suggestions"][0]["name_en"] == "Bread"

    def test_done_with_plain_string(self, client, auth_headers):
        with patch(
            "app.routes.ai.cache.cache_get",
            new=AsyncMock(return_value="not-json-result"),
        ):
            resp = client.get("/api/v1/ai/jobs/job-789", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "done"
        assert data["result"] == "not-json-result"

    def test_unauthenticated(self, client):
        resp = client.get("/api/v1/ai/jobs/job-123")
        assert resp.status_code == 403
