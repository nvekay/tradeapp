import paramiko
import sys

HOST = "77.83.85.223"
USER = "root"
PASS = "ImB4x34AcBRp2T5q7m"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS)
    print("Connected successfully!")
    
    stdin, stdout, stderr = ssh.exec_command("/var/www/tradestat/backend/venv/bin/pip install beautifulsoup4 python-multipart")
    stdout.channel.recv_exit_status()
    
    stdin, stdout, stderr = ssh.exec_command("systemctl restart tradestat-backend")
    stdout.channel.recv_exit_status()
    
    print("Restarted backend")
finally:
    ssh.close()
