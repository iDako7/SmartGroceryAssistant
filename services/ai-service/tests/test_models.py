"""Tests for Pydantic request/response models."""

import pytest
from pydantic import ValidationError


class TestUserProfile:
    def test_defaults(self):
        from app.models import UserProfile

        p = UserProfile()
        assert p.dietary == []
        assert p.household_size == 0
        assert p.taste == ""

    def test_populated(self):
        from app.models import UserProfile

        p = UserProfile(dietary=["vegan", "gluten-free"], household_size=4, taste="spicy")
        assert p.dietary == ["vegan", "gluten-free"]
        assert p.household_size == 4
        assert p.taste == "spicy"


class TestTranslateRequest:
    def test_valid(self):
        from app.models import TranslateRequest

        r = TranslateRequest(name_en="Milk", target_language="Chinese")
        assert r.name_en == "Milk"
        assert r.profile is None

    def test_with_profile(self):
        from app.models import TranslateRequest, UserProfile

        r = TranslateRequest(name_en="Milk", target_language="Chinese", profile=UserProfile(dietary=["vegan"]))
        assert r.profile.dietary == ["vegan"]

    def test_missing_required(self):
        from app.models import TranslateRequest

        with pytest.raises(ValidationError):
            TranslateRequest(name_en="Milk")  # missing target_language


class TestItemInfoRequest:
    def test_valid(self):
        from app.models import ItemInfoRequest

        r = ItemInfoRequest(name_en="Milk")
        assert r.profile is None

    def test_missing_name(self):
        from app.models import ItemInfoRequest

        with pytest.raises(ValidationError):
            ItemInfoRequest()


class TestAlternativesRequest:
    def test_defaults(self):
        from app.models import AlternativesRequest

        r = AlternativesRequest(name_en="Milk")
        assert r.reason == ""
        assert r.profile is None


class TestAlternativesResponse:
    def test_valid(self):
        from app.models import AlternativesResponse

        resp = AlternativesResponse(
            note="Here are some alternatives",
            alts=[{"name_en": "Oat Milk", "match": "Very close", "desc": "Plant-based", "where": "Dairy aisle"}],
        )
        assert len(resp.alts) == 1
        assert resp.alts[0].name_en == "Oat Milk"

    def test_empty_alts(self):
        from app.models import AlternativesResponse

        resp = AlternativesResponse(note="", alts=[])
        assert resp.alts == []


class TestInspireItemRequest:
    def test_defaults(self):
        from app.models import InspireItemRequest

        r = InspireItemRequest(name_en="chicken")
        assert r.other_items == []
        assert r.profile is None

    def test_with_other_items(self):
        from app.models import InspireItemRequest

        r = InspireItemRequest(name_en="chicken", other_items=["rice", "garlic"])
        assert len(r.other_items) == 2


class TestInspireItemResponse:
    def test_valid(self):
        from app.models import InspireItemResponse

        resp = InspireItemResponse(
            recipes=[{"name": "Stir Fry", "emoji": "🍳", "desc": "Quick stir fry", "add": [{"name_en": "soy sauce"}]}]
        )
        assert resp.recipes[0].name == "Stir Fry"
        assert resp.recipes[0].add[0].name_en == "soy sauce"


class TestClarifyRequest:
    def test_valid(self):
        from app.models import ClarifyRequest

        r = ClarifyRequest(sections={"Produce": ["apples"]})
        assert r.profile is None

    def test_missing_sections(self):
        from app.models import ClarifyRequest

        with pytest.raises(ValidationError):
            ClarifyRequest()

    def test_rejects_non_list_values(self):
        from app.models import ClarifyRequest

        with pytest.raises(ValidationError):
            ClarifyRequest(sections={"Produce": "apples"})  # str instead of list[str]

    def test_rejects_non_string_items(self):
        from app.models import ClarifyRequest

        with pytest.raises(ValidationError):
            ClarifyRequest(sections={"Produce": [123]})  # int instead of str


class TestClarifyResponse:
    def test_valid(self):
        from app.models import ClarifyResponse

        resp = ClarifyResponse(questions=[{"q": "How many people?", "options": ["1-2", "3-4"], "allowOther": True}])
        assert len(resp.questions) == 1
        assert resp.questions[0].q == "How many people?"
        assert resp.questions[0].allow_other is True

    def test_alias_serialization(self):
        """allowOther alias works for both input and output."""
        from app.models import ClarifyQuestion

        q = ClarifyQuestion(q="Test?", options=["a"], allowOther=False)
        assert q.allow_other is False
        d = q.model_dump(by_alias=True)
        assert "allowOther" in d


# ── ClarifyAnswer ───────────────────────────────────────


class TestClarifyAnswer:
    def test_valid(self):
        from app.models import ClarifyAnswer

        a = ClarifyAnswer(question="What's the occasion?", answer="Weeknight dinner")
        assert a.question == "What's the occasion?"
        assert a.answer == "Weeknight dinner"

    def test_missing_fields(self):
        from app.models import ClarifyAnswer

        with pytest.raises(ValidationError):
            ClarifyAnswer(question="Only question")


# ── SuggestRequest ──────────────────────────────────────


class TestSuggestRequest:
    def test_valid_full(self):
        from app.models import ClarifyAnswer, SuggestRequest, UserProfile

        r = SuggestRequest(
            sections={"Produce": ["apples"], "Meat": ["chicken"]},
            answers=[ClarifyAnswer(question="Occasion?", answer="Party")],
            profile=UserProfile(dietary=["vegan"]),
        )
        assert len(r.sections) == 2
        assert len(r.answers) == 1
        assert r.profile.dietary == ["vegan"]

    def test_defaults(self):
        from app.models import SuggestRequest

        r = SuggestRequest(sections={"Produce": ["apples"]})
        assert r.answers == []
        assert r.profile is None

    def test_missing_sections(self):
        from app.models import SuggestRequest

        with pytest.raises(ValidationError):
            SuggestRequest()

    def test_empty_answers_valid(self):
        from app.models import SuggestRequest

        r = SuggestRequest(sections={"Produce": ["apples"]}, answers=[])
        assert r.answers == []


# ── SuggestResponse ─────────────────────────────────────


class TestSuggestResponse:
    def test_valid_full(self):
        from app.models import SuggestCluster, SuggestClusterItem, SuggestResponse, SuggestUngroupedItem

        resp = SuggestResponse(
            reason="Asian dinner theme",
            clusters=[
                SuggestCluster(
                    name="Stir Fry Night",
                    emoji="🍜",
                    desc="Quick weeknight stir fry",
                    items=[
                        SuggestClusterItem(name_en="chicken thighs", existing=True),
                        SuggestClusterItem(name_en="soy sauce", existing=False, why="Essential for stir fry"),
                    ],
                )
            ],
            ungrouped=[SuggestUngroupedItem(name_en="apples")],
            storeLayout=[],
        )
        assert resp.reason == "Asian dinner theme"
        assert len(resp.clusters) == 1
        assert resp.clusters[0].items[1].existing is False

    def test_store_layout_alias(self):
        """storeLayout alias works for both input and output."""
        from app.models import StoreLayoutCategory, StoreLayoutItem, SuggestResponse

        resp = SuggestResponse(
            reason="test",
            clusters=[],
            ungrouped=[],
            storeLayout=[
                StoreLayoutCategory(
                    category="Produce",
                    emoji="🥬",
                    items=[StoreLayoutItem(name_en="apples", existing=True)],
                )
            ],
        )
        assert len(resp.store_layout) == 1
        d = resp.model_dump(by_alias=True)
        assert "storeLayout" in d

    def test_defaults(self):
        from app.models import SuggestResponse

        resp = SuggestResponse(reason="", clusters=[], ungrouped=[])
        assert resp.store_layout == []

    def test_populate_by_name(self):
        """Can use store_layout (Python name) directly."""
        from app.models import SuggestResponse

        resp = SuggestResponse(reason="", clusters=[], ungrouped=[], store_layout=[])
        assert resp.store_layout == []


# ── JobStatusResponse ───────────────────────────────────


class TestJobStatusResponse:
    def test_pending(self):
        from app.models import JobStatusResponse

        r = JobStatusResponse(job_id="abc-123", status="pending")
        assert r.result is None
        assert r.error == ""

    def test_done_with_result(self):
        from app.models import JobStatusResponse, SuggestResponse

        result = SuggestResponse(reason="test", clusters=[], ungrouped=[])
        r = JobStatusResponse(job_id="abc-123", status="done", result=result)
        assert r.result.reason == "test"

    def test_failed_with_error(self):
        from app.models import JobStatusResponse

        r = JobStatusResponse(job_id="abc-123", status="failed", error="LLM timeout")
        assert r.error == "LLM timeout"
