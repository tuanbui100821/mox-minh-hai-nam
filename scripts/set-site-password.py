"""Set server-only Pages secrets; never write the password or keys to disk."""
import base64, getpass, hashlib, json, os, secrets, subprocess, sys

def b64(data):
    return base64.urlsafe_b64encode(data).decode().rstrip('=')
password = getpass.getpass('Website password: ') if sys.stdin.isatty() else sys.stdin.readline().rstrip('\r\n')
if not 8 <= len(password) <= 128:
    raise SystemExit('Use a password of 8–128 characters.')
salt = secrets.token_bytes(16)
verifier = {'v': 1, 'iterations': 100000, 'salt': b64(salt), 'hash': b64(hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000, 32))}
payload = {'ROCKISS_PASSWORD_HASH': json.dumps(verifier, separators=(',', ':')), 'ROCKISS_SESSION_KEY': b64(secrets.token_bytes(32))}
runner = 'npx.cmd' if os.name == 'nt' else 'npx'
result = subprocess.run([runner, '--yes', 'wrangler@4.155.0', 'pages', 'secret', 'bulk', '--project-name=kiss-rockiss-2yrs'], input=json.dumps(payload), text=True, encoding='utf-8', errors='replace', capture_output=True)
print(result.stdout)
if result.returncode:
    print(result.stderr, file=sys.stderr)
    raise SystemExit(result.returncode)
print('Server secrets updated. Redeploy the site to apply; previous login sessions will expire.')
