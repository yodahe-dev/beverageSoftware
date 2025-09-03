import subprocess
import sys

redis_path = r"C:\Redis-x64-5.0.14.1\redis-server.exe"

def is_redis_running():
    if sys.platform == "win32":
        result = subprocess.run(
            ["tasklist", "/FI", "IMAGENAME eq redis-server.exe"],
            capture_output=True, text=True
        )
        return "redis-server.exe" in result.stdout
    else:
        result = subprocess.run(["pgrep", "-x", "redis-server"], capture_output=True)
        return bool(result.stdout)

def start_redis():
    if is_redis_running():
        print("Redis is already running.")
        return
    subprocess.Popen([redis_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("Redis server started.")

def stop_redis():
    if not is_redis_running():
        print("Redis is not running.")
        return
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/F", "/IM", "redis-server.exe"], stdout=subprocess.DEVNULL)
    else:
        subprocess.run(["pkill", "redis-server"])
    print("Redis server stopped.")

def status_redis():
    if is_redis_running():
        print("Redis server is running.")
    else:
        print("Redis server is NOT running.")

def main():
    while True:
        print("\nCommands: start | stop | status | exit")
        cmd = input("Enter command: ").strip().lower()

        if cmd == "start":
            start_redis()
        elif cmd == "stop":
            stop_redis()
        elif cmd == "status":
            status_redis()
        elif cmd == "exit":
            print("Exiting. Redis will keep running if started.")
            break
        else:
            print("Unknown command.")

if __name__ == "__main__":
    main()
