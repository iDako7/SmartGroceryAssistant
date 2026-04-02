"""Tests for AI routes — sync endpoints and job status."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from app.models import (
    Alternative,
    AlternativesResponse,
    ClarifyQuestion,
    ClarifyResponse,
    InspireItemResponse,
    ItemInfoResponse,
    Recipe,
    RecipeAddItem,
    TranslateResponse,
)

# ── Sync endpoints ────────────────────────────────────────


class TestTranslate:
    def test_success(self, client, auth_headers):
        with patch(
            "app.routes.ai.domains.translate_item",
            new=AsyncMock(return_value=TranslateResponse(name_translated="牛奶", notes="")),
        ):
            resp = client.post(
                "/api/v1/ai/translate",
                json={"name_en": "Milk", "target_language": "Chinese"},
                headers=auth_headers,
            )
        assert resp.status_code == 200
        assert resp.json()["name_translated"] == "牛奶"

    def test_with_profile(self, client, auth_headers):
        with patch(
            "app.routes.ai.domains.translate_item",
            new=AsyncMock(return_value=TranslateResponse(name_translated="牛奶", notes="")),
        ):
            resp = client.post(
                "/api/v1/ai/translate",
                json={
                    "name_en": "Milk",
                    "target_language": "Chinese",
                    "profile": {"dietary": ["vegan"]},
                },
                headers=auth_headers,
            )
        assert resp.status_code == 200

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
        mock_result = ItemInfoResponse(
            category="Dairy",
            typical_unit="liter",
            storage_tip="Keep refrigerated",
            nutrition_note="High in calcium",
        )
        with patch("app.routes.ai.domains.item_info", new=AsyncMock(return_value=mock_result)):
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
        mock_result = AlternativesResponse(
            note="Good alternatives",
            alts=[Alternative(name_en="Oat Milk", match="Very close", desc="Plant-based", where="Dairy aisle")],
        )
        with patch("app.routes.ai.domains.alternatives", new=AsyncMock(return_value=mock_result)):
            resp = client.post(
                "/api/v1/ai/alternatives",
                json={"name_en": "Milk", "reason": "dairy free"},
                headers=auth_headers,
            )
        assert resp.status_code == 200
        assert len(resp.json()["alts"]) == 1

    def test_no_reason(self, client, auth_headers):
        mock_result = AlternativesResponse(note="", alts=[])
        with patch("app.routes.ai.domains.alternatives", new=AsyncMock(return_value=mock_result)):
            resp = client.post(
                "/api/v1/ai/alternatives",
                json={"name_en": "Milk"},
                headers=auth_headers,
            )
        assert resp.status_code == 200


class TestInspireItem:
    def test_success(self, client, auth_headers):
        mock_result = InspireItemResponse(
            recipes=[
                Recipe(
                    name="Stir Fry",
                    emoji="🍳",
                    desc="Quick chicken stir fry",
                    add=[RecipeAddItem(name_en="soy sauce")],
                )
            ]
        )
        with patch("app.routes.ai.domains.inspire_item", new=AsyncMock(return_value=mock_result)):
            resp = client.post(
                "/api/v1/ai/inspire/item",
                json={"name_en": "chicken", "other_items": ["rice", "garlic"]},
                headers=auth_headers,
            )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["recipes"]) == 1
        assert data["recipes"][0]["name"] == "Stir Fry"

    def test_minimal_request(self, client, auth_headers):
        mock_result = InspireItemResponse(recipes=[])
        with patch("app.routes.ai.domains.inspire_item", new=AsyncMock(return_value=mock_result)):
            resp = client.post(
                "/api/v1/ai/inspire/item",
                json={"name_en": "chicken"},
                headers=auth_headers,
            )
        assert resp.status_code == 200

    def test_missing_name(self, client, auth_headers):
        resp = client.post("/api/v1/ai/inspire/item", json={}, headers=auth_headers)
        assert resp.status_code == 422

    def test_unauthenticated(self, client):
        resp = client.post(
            "/api/v1/ai/inspire/item",
            json={"name_en": "chicken"},
        )
        assert resp.status_code == 403


class TestClarify:
    def test_success(self, client, auth_headers):
        mock_result = ClarifyResponse(
            questions=[
                ClarifyQuestion(
                    q="What's the occasion?", options=["Weekly restock", "Party", "Meal prep"], allowOther=True
                )
            ]
        )
        with patch("app.routes.ai.domains.clarify", new=AsyncMock(return_value=mock_result)):
            resp = client.post(
                "/api/v1/ai/clarify",
                json={"sections": {"Produce": ["apples", "bananas"], "Meat": ["chicken"]}},
                headers=auth_headers,
            )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["questions"]) == 1
        assert data["questions"][0]["q"] == "What's the occasion?"

    def test_missing_sections(self, client, auth_headers):
        resp = client.post("/api/v1/ai/clarify", json={}, headers=auth_headers)
        assert resp.status_code == 422

    def test_unauthenticated(self, client):
        resp = client.post(
            "/api/v1/ai/clarify",
            json={"sections": {"Produce": ["apples"]}},
        )
        assert resp.status_code == 403


# ── POST /suggest ────────────────────────────────────────


class TestSuggestEndpoint:
    def test_returns_202_with_job_id(self, client, auth_headers):
        with (
            patch("app.routes.ai.job_store.set_job_status", new=AsyncMock()),
            patch("app.routes.ai.suggest_task") as mock_task,
        ):
            mock_task.delay = MagicMock()
            resp = client.post(
                "/api/v1/ai/suggest",
                json={"sections": {"Produce": ["apples"]}},
                headers=auth_headers,
            )
        assert resp.status_code == 202
        data = resp.json()
        assert data["status"] == "pending"
        # job_id should be a valid UUID
        uuid.UUID(data["job_id"])

    def test_job_status_set_to_pending(self, client, auth_headers):
        with (
            patch("app.routes.ai.job_store.set_job_status", new=AsyncMock()) as mock_status,
            patch("app.routes.ai.suggest_task") as mock_task,
        ):
            mock_task.delay = MagicMock()
            client.post(
                "/api/v1/ai/suggest",
                json={"sections": {"Produce": ["apples"]}},
                headers=auth_headers,
            )
        mock_status.assert_called_once()
        assert mock_status.call_args[0][1] == "pending"

    def test_celery_task_enqueued(self, client, auth_headers):
        with (
            patch("app.routes.ai.job_store.set_job_status", new=AsyncMock()),
            patch("app.routes.ai.suggest_task") as mock_task,
        ):
            mock_task.delay = MagicMock()
            client.post(
                "/api/v1/ai/suggest",
                json={
                    "sections": {"Produce": ["apples"]},
                    "answers": [{"question": "Occasion?", "answer": "Party"}],
                },
                headers=auth_headers,
            )
        mock_task.delay.assert_called_once()
        call_kwargs = mock_task.delay.call_args.kwargs
        assert call_kwargs["sections"] == {"Produce": ["apples"]}
        assert call_kwargs["answers"] == [{"question": "Occasion?", "answer": "Party"}]

    def test_missing_sections_422(self, client, auth_headers):
        resp = client.post(
            "/api/v1/ai/suggest",
            json={},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_unauthenticated(self, client):
        resp = client.post(
            "/api/v1/ai/suggest",
            json={"sections": {"Produce": ["apples"]}},
        )
        assert resp.status_code == 403

    def test_empty_answers_valid(self, client, auth_headers):
        with (
            patch("app.routes.ai.job_store.set_job_status", new=AsyncMock()),
            patch("app.routes.ai.suggest_task") as mock_task,
        ):
            mock_task.delay = MagicMock()
            resp = client.post(
                "/api/v1/ai/suggest",
                json={"sections": {"Produce": ["apples"]}, "answers": []},
                headers=auth_headers,
            )
        assert resp.status_code == 202


# ── Job status ────────────────────────────────────────────


class TestGetJob:
    def test_unknown_job_404(self, client, auth_headers):
        with patch("app.routes.ai.job_store.get_job_status", new=AsyncMock(return_value=None)):
            resp = client.get("/api/v1/ai/jobs/nonexistent", headers=auth_headers)
        assert resp.status_code == 404

    def test_pending(self, client, auth_headers):
        with patch(
            "app.routes.ai.job_store.get_job_status", new=AsyncMock(return_value={"status": "pending", "error": ""})
        ):
            resp = client.get("/api/v1/ai/jobs/job-123", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "pending"
        assert data["job_id"] == "job-123"

    def test_processing(self, client, auth_headers):
        with patch(
            "app.routes.ai.job_store.get_job_status",
            new=AsyncMock(return_value={"status": "processing", "error": ""}),
        ):
            resp = client.get("/api/v1/ai/jobs/job-123", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "processing"

    def test_done_with_result(self, client, auth_headers):
        result = {"reason": "Test", "clusters": [], "ungrouped": [], "storeLayout": []}
        with (
            patch(
                "app.routes.ai.job_store.get_job_status",
                new=AsyncMock(return_value={"status": "done", "error": ""}),
            ),
            patch("app.routes.ai.job_store.get_job_result", new=AsyncMock(return_value=result)),
        ):
            resp = client.get("/api/v1/ai/jobs/job-456", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "done"
        assert data["result"]["reason"] == "Test"

    def test_failed_with_error(self, client, auth_headers):
        with patch(
            "app.routes.ai.job_store.get_job_status",
            new=AsyncMock(return_value={"status": "failed", "error": "LLM timeout"}),
        ):
            resp = client.get("/api/v1/ai/jobs/job-789", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "failed"
        assert data["error"] == "LLM timeout"

    def test_unauthenticated(self, client):
        resp = client.get("/api/v1/ai/jobs/job-123")
        assert resp.status_code == 403
