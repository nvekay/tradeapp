import paramiko

HOST = "77.83.85.223"
USER = "root"
PASS = "ImB4x34AcBRp2T5q7m"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS)
    
    stdin, stdout, stderr = ssh.exec_command('tail -n 30 /var/log/nginx/error.log')
    print("NGINX ERROR LOG:", stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command('tail -n 30 /var/log/nginx/access.log | grep -v "127.0.0.1"')
    print("NGINX ACCESS LOG:", stdout.read().decode())
    
finally:
    ssh.close()
