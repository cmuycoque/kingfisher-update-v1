"""Static file server plus /api/contact, which emails form submissions via Resend.

Run: python server.py   (reads RESEND_API_KEY from the environment or a .env file)
"""
import html
import json
import os
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

def load_env():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            for line in f:
                if "=" in line and not line.lstrip().startswith("#"):
                    k, v = line.strip().split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


load_env()
TO_EMAIL = os.environ.get("CONTACT_TO_EMAIL", "matthewuycoque@gmail.com")
FROM_EMAIL = os.environ.get("CONTACT_FROM_EMAIL", "Kingfisher & Kite <onboarding@resend.dev>")


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path not in ("/api/contact", "/contact.php"):
            return self.reply(404, {"error": "Not found"})
        try:
            size = int(self.headers.get("Content-Length", 0))
            if size > 20000:
                return self.reply(413, {"error": "Message too large"})
            d = json.loads(self.rfile.read(size))
            name, email, message = (str(d.get(k, "")).strip() for k in ("name", "email", "message"))
            company = str(d.get("company", "")).strip()
            service = str(d.get("service", "")).strip()
            if not (name and email and message):
                return self.reply(400, {"error": "Missing fields"})
        except Exception:
            return self.reply(400, {"error": "Invalid request"})

        e = html.escape
        body = (
            f"<p><b>Name:</b> {e(name)}<br><b>Company:</b> {e(company)}<br>"
            f"<b>Email:</b> {e(email)}<br><b>Service:</b> {e(service)}</p>"
            f"<p>{e(message).replace(chr(10), '<br>')}</p>"
        )
        payload = json.dumps({
            "from": FROM_EMAIL,
            "to": [TO_EMAIL],
            "reply_to": email,
            "subject": f"Website inquiry: {service or 'General'} - {name}",
            "html": body,
        }).encode()
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={
                "Authorization": "Bearer " + os.environ.get("RESEND_API_KEY", ""),
                "Content-Type": "application/json",
                "User-Agent": "kingfisher-site/1.0",
            },
        )
        try:
            urllib.request.urlopen(req, timeout=15).read()
            self.reply(200, {"ok": True})
        except Exception as ex:
            print("Resend error:", getattr(ex, "read", lambda: ex)())
            self.reply(502, {"error": "Could not send"})

    def reply(self, status, obj):
        data = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    load_env()
    port = int(os.environ.get("PORT", 8000))
    print(f"Serving on http://localhost:{port}")
    ThreadingHTTPServer(("", port), Handler).serve_forever()
