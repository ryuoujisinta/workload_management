import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / 'data'
USERS_FILE = DATA_DIR / 'users.json'
TASKS_FILE = DATA_DIR / 'tasks.json'
WORKLOADS_DIR = DATA_DIR / 'workloads'


def load_json(file_path, default):
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return default


def save_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_users():
    return load_json(USERS_FILE, [])


def add_user(user):
    users = get_users()
    users.append(user)
    save_json(USERS_FILE, users)


def get_tasks():
    return load_json(TASKS_FILE, [])


def add_task(task):
    tasks = get_tasks()
    tasks.append(task)
    save_json(TASKS_FILE, tasks)
