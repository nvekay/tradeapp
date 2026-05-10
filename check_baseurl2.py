import paramiko

HOST = "77.83.85.223"
USER = "root"
PASS = "ImB4x34AcBRp2T5q7m"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS)
    
    stdin, stdout, stderr = ssh.exec_command("grep -o -E '.{0,20}baseURL.{0,20}' /var/www/tradestat/frontend/dist/assets/index-*.js")
    print("MATCHES:", stdout.read().decode())
    
finally:
    ssh.close()
