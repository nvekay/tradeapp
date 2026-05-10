import paramiko

HOST = "77.83.85.223"
USER = "root"
PASS = "ImB4x34AcBRp2T5q7m"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS)
    
    stdin, stdout, stderr = ssh.exec_command("curl -s -I -X GET http://127.0.0.1:8000/trades/")
    print("DIRECT 1:", stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command("curl -s -I -X GET http://127.0.0.1:8000/trades")
    print("DIRECT 2:", stdout.read().decode())
    
finally:
    ssh.close()
