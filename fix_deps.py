import paramiko

HOST = "77.83.85.223"
USER = "root"
PASS = "ImB4x34AcBRp2T5q7m"

def run_cmd(ssh, cmd):
    print(f"Running: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    for line in iter(stdout.readline, ""):
        print(line, end="")

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS)
    print("Connected successfully!")
    
    run_cmd(ssh, "/var/www/tradestat/backend/venv/bin/pip install beautifulsoup4 python-multipart")
    run_cmd(ssh, "systemctl restart tradestat-backend")
    
finally:
    ssh.close()
