import paramiko

HOST = "77.83.85.223"
USER = "root"
PASS = "ImB4x34AcBRp2T5q7m"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS)

stdin, stdout, stderr = ssh.exec_command("journalctl -u tradestat-backend --no-pager | tail -n 50")
print(stdout.read().decode())

ssh.close()
