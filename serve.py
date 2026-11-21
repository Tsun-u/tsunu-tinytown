"""開發用的靜態伺服器：只送遊戲本身的檔案，docs/ 這類本機資料不對外。

用法：python serve.py [位址] [port]，預設 127.0.0.1:8798。給區網的平板試玩時，位址填這台電腦的區網 IP。
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PUBLIC = ('index.html', 'styles.css', 'savebox.js', 'src/', 'vendor/')


class GameFiles(SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0].lstrip('/') or 'index.html'
        if not any(path == entry or (entry.endswith('/') and path.startswith(entry)) for entry in PUBLIC):
            self.send_error(404)
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')   # 改完程式，平板重新整理就拿到新的
        super().end_headers()


if __name__ == '__main__':
    host = sys.argv[1] if len(sys.argv) > 1 else '127.0.0.1'
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8798
    print(f'http://{host}:{port}/', flush=True)
    ThreadingHTTPServer((host, port), partial(GameFiles, directory=str(ROOT))).serve_forever()
