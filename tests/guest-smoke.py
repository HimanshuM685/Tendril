"""Run via OCI stdin, without host mounts/ports. Not a separate-kernel test."""
import json
import os
import pathlib
import subprocess
import time
import urllib.request
import nbformat
import websocket

def job(body):
    result = subprocess.run(['/usr/local/bin/tendril-job'], input=json.dumps(body), text=True, capture_output=True, timeout=10)
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)

assert job({'payload': "print('python-ok')", 'timeout': 5}) == {'ok': True, 'output': 'python-ok\n'}
start = time.monotonic()
assert not job({'payload': 'import time; time.sleep(10)', 'timeout': 1})['ok']
assert time.monotonic() - start < 4
folder = pathlib.Path('/work/jobs/smoke')
folder.mkdir(parents=True)
notebook = nbformat.v4.new_notebook(cells=[nbformat.v4.new_code_cell("from pathlib import Path\nPath('artifact.txt').write_text('guest')\nprint('notebook-ok')")],
                                     metadata={'kernelspec': {'name': 'python3', 'display_name': 'Python 3', 'language': 'python'}})
nbformat.write(notebook, folder / 'in.ipynb')
assert job({'jobId': 'smoke', 'timeout': 5})['ok']
assert (folder / 'out.ipynb').exists()
assert (folder / 'artifact.txt').read_text() == 'guest'
token = 'packaging-fixture'
p = subprocess.Popen(['jupyter', 'lab', '--no-browser', '--allow-root', '--ServerApp.ip=127.0.0.1', '--ServerApp.root_dir=/work',
                      '--ServerApp.port=8888', '--IdentityProvider.token=' + token], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
base = 'http://127.0.0.1:8888'
def request(path, body=None, method='GET'):
    req = urllib.request.Request(base + path, data=None if body is None else json.dumps(body).encode(), method=method,
                                 headers={'Authorization': 'token ' + token, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=2) as res:
        return json.load(res) if res.status != 204 else None
try:
    for _ in range(100):
        try:
            request('/api/status')
            break
        except OSError:
            time.sleep(.1)
    else:
        raise AssertionError('Jupyter status not ready')
    kernel = request('/api/kernels', {'name': 'python3'}, 'POST')
    ws = websocket.create_connection('ws://127.0.0.1:8888/api/kernels/' + kernel['id'] + '/channels',
                                     header={'Authorization': 'token ' + token}, origin=base, timeout=5)
    ws.send(json.dumps({'header': {'msg_id': 'smoke', 'session': 'smoke', 'username': 'smoke', 'msg_type': 'kernel_info_request', 'version': '5.3'},
                        'parent_header': {}, 'metadata': {}, 'content': {}, 'channel': 'shell', 'buffers': []}))
    for _ in range(20):
        if json.loads(ws.recv())['header']['msg_type'] == 'kernel_info_reply':
            break
    else:
        raise AssertionError('Jupyter WebSocket kernel roundtrip failed')
    ws.close()
    request('/api/kernels/' + kernel['id'], method='DELETE')
finally:
    p.terminate()
    p.wait(timeout=5)

# Exercise the legacy entrypoint's combined agent-key + renter-password flow.
key = '/work/agent-key'
subprocess.run(['ssh-keygen', '-t', 'ed25519', '-N', '', '-f', key, '-q'], check=True)
env = dict(os.environ, NO_BORE='1', SSH_PUBKEY=pathlib.Path(key + '.pub').read_text(), SSH_PASSWORD='renter-fixture')
entry = subprocess.Popen(['/entrypoint.sh'], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
try:
    hosts = '/work/known_hosts'
    for _ in range(100):
        host_key = pathlib.Path('/etc/ssh/ssh_host_ed25519_key.pub')
        if host_key.exists():
            pathlib.Path(hosts).write_text('127.0.0.1 ' + host_key.read_text())
            break
        time.sleep(.05)
    ssh_args = ['ssh', '-o', 'StrictHostKeyChecking=yes', '-o', 'UserKnownHostsFile=' + hosts, '-o', 'ConnectTimeout=1']
    for _ in range(100):
        res = subprocess.run(ssh_args + ['-i', key, '-o', 'BatchMode=yes', 'root@127.0.0.1', 'id -u'], capture_output=True, text=True)
        if res.returncode == 0:
            assert res.stdout.strip() == '0'
            break
        time.sleep(.05)
    else:
        raise AssertionError('legacy authenticated SSH failed: ' + res.stderr)
    askpass = pathlib.Path('/work/askpass')
    askpass.write_text('#!/usr/local/bin/python3\nprint("renter-fixture")\n')
    askpass.chmod(0o700)
    password_env = dict(os.environ, SSH_ASKPASS=str(askpass), SSH_ASKPASS_REQUIRE='force', DISPLAY='fixture:0')
    res = subprocess.run(ssh_args + ['-o', 'PubkeyAuthentication=no', '-o', 'PreferredAuthentications=password',
                                    'root@127.0.0.1', 'id -u'], env=password_env, capture_output=True, text=True, timeout=5)
    assert res.returncode == 0 and res.stdout.strip() == '0', res.stderr
finally:
    os.killpg(entry.pid, 15)
    entry.wait(timeout=5)

# Public-key rents disable password auth, including after locking root's password.
entry = subprocess.Popen(['/entrypoint.sh'], env=dict(env, SSH_PASSWORD=''),
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
try:
    for _ in range(100):
        res = subprocess.run(ssh_args + ['-i', key, '-o', 'BatchMode=yes', 'root@127.0.0.1', 'id -u'], capture_output=True, text=True)
        if res.returncode == 0:
            assert res.stdout.strip() == '0'
            break
        time.sleep(.05)
    else:
        raise AssertionError('key-only SSH failed: ' + res.stderr)
    res = subprocess.run(ssh_args + ['-o', 'PubkeyAuthentication=no', '-o', 'PreferredAuthentications=password',
                                    'root@127.0.0.1', 'id -u'], env=password_env, capture_output=True, text=True, timeout=5)
    assert res.returncode != 0, 'key-only rent unexpectedly accepted a password'
finally:
    os.killpg(entry.pid, 15)
    entry.wait(timeout=5)
print('OCI guest smoke: Python, deadline cleanup, notebook/artifact, Jupyter WebSocket and key/password SSH passed')
