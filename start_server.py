#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

# ポート設定
PORT = 8080

# publicディレクトリに移動
public_dir = "/Users/kamidotomoki/Documents/oncall-scheduler/frontend2/oncall-scheduler-frontend/public"
os.chdir(public_dir)

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_GET(self):
        if self.path == '/':
            self.path = '/test.html'
        return super().do_GET()

def start_server():
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"🚀 OnCall Pro テストサーバーが起動しました")
        print(f"📱 ブラウザで http://localhost:{PORT} にアクセスしてください")
        print(f"🛑 サーバーを停止するには Ctrl+C を押してください")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 サーバーを停止しています...")
            httpd.shutdown()

if __name__ == "__main__":
    start_server()
