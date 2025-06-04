from datetime import date, timedelta
from flask import Blueprint, render_template, request, redirect, url_for

from .models import add_task, add_user, get_tasks, get_users

bp = Blueprint('main', __name__)


def next_seven_days():
    today = date.today()
    return [(today + timedelta(days=i)).isoformat() for i in range(7)]


@bp.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # 実際の認証処理は省略
        return redirect(url_for('main.workloads'))
    return render_template('login.html')


@bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        user = {
            'username': request.form['username'],
            'password': request.form['password'],
            'role': request.form['role']
        }
        add_user(user)
        return redirect(url_for('main.login'))
    return render_template('register.html')


@bp.route('/tasks', methods=['GET', 'POST'])
def tasks():
    if request.method == 'POST':
        task = {
            'name': request.form['task_name'],
            'description': request.form['description']
        }
        add_task(task)
    return render_template('tasks.html')


@bp.route('/workloads', methods=['GET', 'POST'])
def workloads():
    tasks = [t['name'] for t in get_tasks()]
    dates = next_seven_days()
    if request.method == 'POST':
        # 工数保存処理は省略
        pass
    return render_template('workloads.html', tasks=tasks, dates=dates)
