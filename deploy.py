import os
import shutil
import subprocess

project_name = "vod-viewer"
github_username = "lpuygrenier"

# Function to run shell commands
def run_command(command):
    subprocess.run(command, shell=True, check=True)

# Delete all files except deploy.py
for item in os.listdir():
    if item != "deploy.py":
        if os.path.isfile(item):
            os.remove(item)
        elif os.path.isdir(item):
            shutil.rmtree(item)

# Clone the project
run_command(f"git clone https://github.com/{github_username}/{project_name}.git")

# Move all files from the cloned project to current directory
for item in os.listdir(project_name):
    shutil.move(os.path.join(project_name, item), ".")

# Remove the cloned folder
shutil.rmtree(project_name)

# Git add, commit, and push
run_command("git add .")
run_command(f'git commit -m "deploy: new version of {project_name}"')
run_command("git push")

print("Deployment completed successfully.")
