from fastapi.testclient import TestClient
from main import app, parse_text_to_questions

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_parse_text_heuristic():
    sample_text = """
    JEE Main 2024
    Q.1 The speed of light is:
    (A) 3e8
    (B) 3e5
    (C) 0
    (D) None
    """
    questions = parse_text_to_questions(sample_text)
    assert len(questions) == 1
    assert "speed of light" in questions[0].statement
    assert len(questions[0].options) == 4
    assert questions[0].options[0].label == "A"
    assert questions[0].options[0].text == "3e8"
