import paramiko
import sys

HOST = "77.83.85.223"
USER = "root"
PASS = "ImB4x34AcBRp2T5q7m"

def run_cmd(ssh, cmd):
    print(f"Running: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    
    for line in iter(stdout.readline, ""):
        sys.stdout.buffer.write(line.encode('utf-8', errors='ignore'))
        sys.stdout.flush()
        
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0:
        print(f"\nFAILED (Exit Code: {exit_status})")
    return exit_status

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS)
    print("Connected successfully!")
    
    # Install certbot
    run_cmd(ssh, "DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx")
    
    # Run certbot for the domain
    run_cmd(ssh, "certbot --nginx -d tradestat.app --non-interactive --agree-tos -m admin@tradestat.app --redirect")
    
    print("\nSSL Setup Complete!")

finally:
    ssh.close()
