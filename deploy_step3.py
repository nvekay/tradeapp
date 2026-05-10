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
    
    # 2. Install Node.js
    run_cmd(ssh, "DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a apt-get install -y nodejs")
    
    # 3. Setup PostgreSQL
    db_setup_cmd = """
sudo -u postgres psql -c "CREATE DATABASE journal_db;" || true
sudo -u postgres psql -c "CREATE USER journal_user WITH PASSWORD 'ImB4x34AcBRp2T5q7m';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE journal_db TO journal_user;" || true
sudo -u postgres psql -c "ALTER DATABASE journal_db OWNER TO journal_user;" || true
"""
    run_cmd(ssh, db_setup_cmd)
    
    # 4. Setup Backend
    run_cmd(ssh, "python3 -m venv /var/www/tradestat/backend/venv")
    run_cmd(ssh, "/var/www/tradestat/backend/venv/bin/pip install -r /var/www/tradestat/backend/requirements.txt")
    run_cmd(ssh, "/var/www/tradestat/backend/venv/bin/pip install psycopg2-binary gunicorn")
    
    env_content = "DATABASE_URL=postgresql://journal_user:ImB4x34AcBRp2T5q7m@localhost:5432/journal_db"
    run_cmd(ssh, f"echo '{env_content}' > /var/www/tradestat/backend/.env")
    
    # Setup Systemd Service for Backend
    service_file = """[Unit]
Description=Gunicorn instance to serve FastAPI Application
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory=/var/www/tradestat/backend
Environment="PATH=/var/www/tradestat/backend/venv/bin"
ExecStart=/var/www/tradestat/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000

[Install]
WantedBy=multi-user.target
"""
    run_cmd(ssh, f"cat << 'EOF' > /etc/systemd/system/tradestat-backend.service\n{service_file}\nEOF")
    run_cmd(ssh, "systemctl daemon-reload")
    run_cmd(ssh, "systemctl enable tradestat-backend")
    run_cmd(ssh, "systemctl restart tradestat-backend")
    
    # 5. Setup Frontend
    run_cmd(ssh, "echo 'VITE_API_URL=/api' > /var/www/tradestat/frontend/.env.production")
    run_cmd(ssh, "cd /var/www/tradestat/frontend && npm install")
    run_cmd(ssh, "cd /var/www/tradestat/frontend && npm run build")
    
    # 6. Setup Nginx
    nginx_conf = """server {
    listen 80;
    server_name tradestat.app 77.83.85.223;

    root /var/www/tradestat/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
"""
    run_cmd(ssh, f"cat << 'EOF' > /etc/nginx/sites-available/tradestat\n{nginx_conf}\nEOF")
    run_cmd(ssh, "ln -sf /etc/nginx/sites-available/tradestat /etc/nginx/sites-enabled/")
    run_cmd(ssh, "rm -f /etc/nginx/sites-enabled/default")
    run_cmd(ssh, "nginx -t")
    run_cmd(ssh, "systemctl restart nginx")

    print("\nDeploy complete!")

finally:
    ssh.close()
