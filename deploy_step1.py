import paramiko
import sys

HOST = "77.83.85.223"
USER = "root"
PASS = "ImB4x34AcBRp2T5q7m"

def run_cmd(ssh, cmd):
    print(f"Running: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    
    for line in iter(stdout.readline, ""):
        print(line, end="")
        
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0:
        print(f"FAILED (Exit Code: {exit_status})")
    return exit_status

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS)
    print("Connected successfully!")
    
    run_cmd(ssh, "rm -rf /var/www/tradestat")
    run_cmd(ssh, "git clone https://nvekay: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@github.com/nvekay/tradeapp.git /var/www/tradestat")
    run_cmd(ssh, "ls -la /var/www/tradestat")

finally:
    ssh.close()
