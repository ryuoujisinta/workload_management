import json
from pathlib import Path
import pytest

from app import create_app
from app import models


@pytest.fixture
def client(tmp_path, monkeypatch):
    data_dir = tmp_path
    users_file = data_dir / 'users.json'
    tasks_file = data_dir / 'tasks.json'
    workloads_dir = data_dir / 'workloads'
    workloads_dir.mkdir()

    monkeypatch.setattr(models, 'DATA_DIR', data_dir)
    monkeypatch.setattr(models, 'USERS_FILE', users_file)
    monkeypatch.setattr(models, 'TASKS_FILE', tasks_file)
    monkeypatch.setattr(models, 'WORKLOADS_DIR', workloads_dir)

    # Ensure empty data files
    models.save_json(users_file, [])
    models.save_json(tasks_file, [])

    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_login_page(client):
    res = client.get('/')
    assert res.status_code == 200
    assert 'ログイン' in res.get_data(as_text=True)


def test_login_post_redirects(client):
    data = {'username': 'foo', 'password': 'bar'}
    res = client.post('/', data=data, follow_redirects=False)
    assert res.status_code == 302
    assert res.headers['Location'].endswith('/workloads')


def test_register_page(client):
    res = client.get('/register')
    assert res.status_code == 200
    assert 'ユーザー登録' in res.get_data(as_text=True)


def test_tasks_page(client):
    res = client.get('/tasks')
    assert res.status_code == 200
    assert 'タスク登録' in res.get_data(as_text=True)


def test_workloads_page_no_tasks(client):
    res = client.get('/workloads')
    assert res.status_code == 200
    text = res.get_data(as_text=True)
    assert '工数登録' in text
    # default tasks list is empty, but table header shows dates
    from datetime import date, timedelta
    today = date.today()
    for i in range(7):
        assert (today + timedelta(days=i)).isoformat() in text

def test_register_post_adds_user(client, tmp_path):
    data = {'username': 'foo', 'password': 'bar', 'role': 'user'}
    res = client.post('/register', data=data, follow_redirects=False)
    assert res.status_code == 302
    # After posting, the user should be saved to file in tmp_path
    users = models.load_json(models.USERS_FILE, [])
    assert any(u['username'] == 'foo' for u in users)


def test_tasks_post_adds_task(client):
    data = {'task_name': 'task1', 'description': 'desc'}
    res = client.post('/tasks', data=data, follow_redirects=False)
    assert res.status_code == 200  # tasks page renders after POST
    tasks = models.load_json(models.TASKS_FILE, [])
    assert any(t['name'] == 'task1' for t in tasks)


def test_workloads_page_with_tasks(client):
    models.add_task({'name': 'task1', 'description': 'desc'})
    res = client.get('/workloads')
    assert res.status_code == 200
    text = res.get_data(as_text=True)
    assert 'task1' in text
