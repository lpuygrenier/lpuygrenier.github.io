import os
import stat
import shutil
import subprocess
from fnmatch import fnmatch

project_name = "vod-viewer"
github_username = "lpuygrenier"

def run_command(command):
    print(command)
    subprocess.run(command, shell=True, check=True)

def handle_remove_readonly(func, path, exc_info):
    os.chmod(path, stat.S_IWRITE)
    func(path)

print(f"Deploying {project_name}...")

# Delete files while preserving .git and deploy.py
for item in os.listdir():
    if item not in [".git", "deploy.py"]:
        item_path = os.path.join(os.getcwd(), item)
        if os.path.isfile(item_path):
            os.chmod(item_path, stat.S_IWRITE)
            os.remove(item_path)
        elif os.path.isdir(item_path):
            shutil.rmtree(item_path, onerror=handle_remove_readonly)

# Clone repository
repo_url = f"https://github.com/{github_username}/{project_name}.git"
run_command(f"git clone {repo_url}")

# Move files from cloned repo (excluding .git)
clone_dir = os.path.join(os.getcwd(), project_name)
for item in os.listdir(clone_dir):
    if item != ".git":
        src = os.path.join(clone_dir, item)
        if os.path.exists(src):
            dest = os.path.join(os.getcwd(), item)
            if os.path.exists(dest):
                if os.path.isdir(dest):
                    shutil.rmtree(dest, onerror=handle_remove_readonly)
                else:
                    os.chmod(dest, stat.S_IWRITE)
                    os.remove(dest)
            shutil.move(src, os.getcwd())

# Cleanup cloned directory
shutil.rmtree(clone_dir, onerror=handle_remove_readonly)

# Git operations
run_command("git add .")
run_command(f'git commit -m "deploy: new version of {project_name}"')
run_command("git push")

print("Deployment successful!")
