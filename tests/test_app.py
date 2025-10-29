import urllib.parse

from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_get_activities_structure():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # expect a dictionary of activities
    assert isinstance(data, dict)
    # some known activities exist
    assert "Chess Club" in data
    assert "Programming Class" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "pytest-user@example.com"

    # ensure email not present
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants = resp.json()[activity]["participants"]
    if email in participants:
        # remove if previous run left it (cleanup)
        client.post(f"/activities/{urllib.parse.quote(activity)}/unregister", params={"email": email})

    # sign up
    resp = client.post(f"/activities/{urllib.parse.quote(activity)}/signup", params={"email": email})
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # verify present
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants = resp.json()[activity]["participants"]
    assert email in participants

    # signing up again should fail with 400
    resp = client.post(f"/activities/{urllib.parse.quote(activity)}/signup", params={"email": email})
    assert resp.status_code == 400

    # unregister
    resp = client.post(f"/activities/{urllib.parse.quote(activity)}/unregister", params={"email": email})
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # verify removed
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants = resp.json()[activity]["participants"]
    assert email not in participants


def test_unregister_nonexistent():
    activity = "Programming Class"
    email = "does-not-exist@example.com"

    # ensure it's not present
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants = resp.json()[activity]["participants"]
    if email in participants:
        client.post(f"/activities/{urllib.parse.quote(activity)}/unregister", params={"email": email})

    # trying to unregister someone not registered should return 400
    resp = client.post(f"/activities/{urllib.parse.quote(activity)}/unregister", params={"email": email})
    assert resp.status_code == 400
