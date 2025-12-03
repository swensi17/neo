import subprocess
import os

# === НАСТРОЙКИ ===
GITHUB_USERNAME = "swensi17"
REPO_NAME = "neo"

def get_token():
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env.local')
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if line.startswith('GITHUB_TOKEN='):
                    return line.split('=', 1)[1].strip()
    return input("Введите GitHub токен: ").strip()

def run(cmd):
    print(f">>> {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)
    return result.returncode == 0

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    token = get_token()
    remote_url = f"https://{token}@github.com/{GITHUB_USERNAME}/{REPO_NAME}.git"
    
    print("📄 Деплою README.md в main...\n")
    
    run("git config user.email \"tutatutaev9@gmail.com\"")
    run("git config user.name \"swensi17\"")
    run(f"git remote set-url origin {remote_url}")
    
    run("git add README.md")
    run('git commit -m "Update README"')
    
    if run("git push origin main --force"):
        print(f"\n✅ README обновлён!")
        print(f"📄 https://github.com/{GITHUB_USERNAME}/{REPO_NAME}")

if __name__ == "__main__":
    main()
