import pytest

from app.schemas.contracts import Questionnaire
from app.services.triage import prioritize


@pytest.mark.parametrize(
    "field,expected",
    [
        ("fever", "alerta"),
        ("wound_opening", "alerta"),
        ("increased_pain", "vigilancia"),
        ("discharge", "vigilancia"),
        ("odor", "vigilancia"),
    ],
)
def test_positive_signals_survive_normal_image(answers, field, expected):
    answers[field] = True
    result = prioritize(Questionnaire(**answers), {"status": "available", "priority": "normal"})
    assert result.priority == expected


def test_no_false_normal_when_model_missing(answers):
    result = prioritize(Questionnaire(**answers), {"status": "unavailable"})
    assert result.priority is None
    assert any("revisión humana" in reason for reason in result.reasons)


def test_incomplete_preserves_alert(answers):
    answers.update(fever=True, pain=None)
    result = prioritize(Questionnaire(**answers), {"status": "unavailable"})
    assert result.priority == "alerta"
    assert any("desconocidas" in reason for reason in result.reasons)


def test_unknown_never_becomes_normal(answers):
    answers["fever"] = None
    assert (
        prioritize(
            Questionnaire(**answers),
            {
                "status": "available",
                "priority": "normal",
            },
        ).priority
        is None
    )


@pytest.mark.parametrize(
    "pain,priority", [(0, None), (3, None), (4, "vigilancia"), (10, "vigilancia")]
)
def test_pain_boundary(answers, pain, priority):
    answers["pain"] = pain
    assert prioritize(Questionnaire(**answers), {"status": "unavailable"}).priority == priority


def test_visual_alert_escalates(answers):
    assert (
        prioritize(
            Questionnaire(**answers),
            {
                "status": "available",
                "priority": "alerta",
            },
        ).priority
        == "alerta"
    )
