import subprocess
import sys
import os

def main():
    print("=" * 60)
    print("      Launching MechShield AI Hackathon Platform")
    print("=" * 60)

    try:
        import uvicorn
        print("\n[+] Starting FastAPI backend on http://localhost:8000 ...")
        uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
    except ImportError:
        print("\n[!] uvicorn not installed in active Python environment.")
        print("[+] Falling back to high-performance Node.js runtime...")
        server_js = os.path.join(os.path.dirname(__file__), "server.js")
        subprocess.run(["node", server_js])

if __name__ == "__main__":
    main()
