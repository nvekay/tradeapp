import paramiko

HOST = "77.83.85.223"
USER = "root"
PASS = "ImB4x34AcBRp2T5q7m"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS)
    
    stdin, stdout, stderr = ssh.exec_command("cat /var/www/tradestat/frontend/.env.production")
    print("ENV:", stdout.read().decode().strip())
    
    # Check if vite uses the right API URL
    stdin, stdout, stderr = ssh.exec_command("grep -r '/api' /var/www/tradestat/frontend/dist")
    print("GREP:", stdout.read().decode().strip()[:500])
    
finally:
    ssh.close()
