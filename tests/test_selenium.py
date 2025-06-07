import os
import json
import shutil
from threading import Thread
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from werkzeug.serving import make_server

from app import create_app, models


def has_chrome():
    return shutil.which("chromium-browser") or shutil.which("google-chrome")


@pytest.fixture(scope="module")
def live_server(tmp_path_factory, monkeypatch):
    tmp_path = tmp_path_factory.mktemp("data")
    data_dir = Path(tmp_path)
    users_file = data_dir / "users.json"
    tasks_file = data_dir / "tasks.json"
    workloads_dir = data_dir / "workloads"
    workloads_dir.mkdir()

    monkeypatch.setattr(models, "DATA_DIR", data_dir)
    monkeypatch.setattr(models, "USERS_FILE", users_file)
    monkeypatch.setattr(models, "TASKS_FILE", tasks_file)
    monkeypatch.setattr(models, "WORKLOADS_DIR", workloads_dir)

    models.save_json(users_file, [])
    models.save_json(tasks_file, [])

    app = create_app()
    server = make_server("127.0.0.1", 0, app)
    port = server.server_port
    thread = Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()

    yield f"http://127.0.0.1:{port}"

    server.shutdown()
    thread.join()


@pytest.fixture(scope="module")
def driver():
    if not has_chrome():
        pytest.skip("chrome not available")
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    try:
        drv = webdriver.Chrome(options=options)
    except Exception:
        pytest.skip("unable to start chrome")
    yield drv
    drv.quit()


def test_login_to_workloads(driver, live_server):
    driver.get(live_server + "/")
    driver.find_element(By.NAME, "username").send_keys("foo")
    driver.find_element(By.NAME, "password").send_keys("bar")
    driver.find_element(By.TAG_NAME, "button").click()
    assert driver.current_url.endswith("/workloads")


def test_login_link_to_register(driver, live_server):
    driver.get(live_server + "/")
    driver.find_element(By.LINK_TEXT, "新規登録はこちら").click()
    assert "ユーザー登録" in driver.page_source


@pytest.mark.xfail(reason="error messages not implemented")
def test_register_missing_fields_shows_error(driver, live_server):
    driver.get(live_server + "/register")
    driver.find_element(By.TAG_NAME, "button").click()
    assert "エラー" in driver.page_source
