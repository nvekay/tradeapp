import paramiko

HOST = "77.83.85.223"
USER = "root"
PASS = "ImB4x34AcBRp2T5q7m"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS)
    
    stdin, stdout, stderr = ssh.exec_command("curl -s -X GET http://127.0.0.1/api/trades/")
    out = stdout.read().decode()
    print("NGINX API GET (first 500 chars):", out[:500])
    print("Length:", len(out))
    
finally:
    ssh.close()
