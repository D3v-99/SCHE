# AD Login Mock (React + Node)

This is a minimal **one-page** React app with a Node/Express backend.

- The page calls `POST /api/test-login`
- The backend posts `{ "username": "...", "password": "..." }` to `AD_LOGIN_URL` using **env-provided test credentials**

Security: the browser UI does **not** collect passwords. Put test creds only in `server/.env` on the server.

## Configure

- Copy `server/.env.example` to `server/.env` and adjust values if needed.

The endpoint tested is:

- `POST /api/test-login` → returns `{ ok, upstreamStatus, upstreamBody }`

## Run (dev)

```bash
source "$HOME/.nvm/nvm.sh"
cd /home/adolph/Desktop/sche
npm install
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3000

## Build + run (prod)

```bash
source "$HOME/.nvm/nvm.sh"
cd /home/adolph/Desktop/sche
npm install
npm run build
npm start
```

Then open: http://localhost:3000

## Docker Compose (recommended for deployment)

This runs **two containers**:

- `client` (nginx) on http://localhost:8080
- `server` (express) on http://localhost:3000

```bash
cd /home/adolph/Desktop/sche
docker compose up --build
```

Open: http://localhost:8080

## Host as a subdomain (Nginx)

If you deploy with Docker Compose, point Nginx at the **client** container port (8080 on the host). The client container proxies `/api/*` to the backend internally.

```nginx
server {
	listen 443 ssl;
	server_name your-subdomain.example.com;

	location / {
		proxy_pass http://127.0.0.1:8080;
		proxy_http_version 1.1;
		proxy_set_header Host $host;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}
}
```

Run the app with a process manager (systemd/pm2) so it stays up.
# SCHE
