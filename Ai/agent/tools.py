import os
import ctypes
import psutil
import pyautogui
import pyperclip
import requests
import webbrowser
import subprocess
from typing import Optional, List
from langchain_core.tools import tool
from tavily import TavilyClient


# =====================================================================
# 1. WEB & REAL-TIME DATA TOOLS (ALL FREE / ZERO-KEY EXCEPT TAVILY)
# =====================================================================

@tool
def tavily_search(query: str, max_results: int = 5) -> str:
    """
    Search the live web for the latest data, current events, recent news, sports, or real-time information.
    Call this tool when the query asks for live facts, recent releases, or anything post-training.
    """
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return "Error: TAVILY_API_KEY is not configured in the environment."

    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(query=query, max_results=max_results, search_depth="basic")
        results = response.get("results", [])
        if not results:
            return f"No search results found for query: '{query}'."

        formatted = []
        for i, item in enumerate(results, 1):
            title = item.get("title", "No Title")
            url = item.get("url", "")
            content = item.get("content", "")
            formatted.append(f"{i}. **{title}**\n   {content}\n   Source: {url}")

        return "\n\n".join(formatted)
    except Exception as e:
        return f"Web search error: {str(e)}"


@tool
def fetch_web_page(url: str) -> str:
    """
    Fetch and read the readable text content of any public webpage, blog post, or article URL.
    Use this when the user asks to summarize, inspect, or read a specific URL.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()

        import re
        text = re.sub(r'<script.*?</script>', '', resp.text, flags=re.DOTALL)
        text = re.sub(r'<style.*?</style>', '', text, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        clean_text = ' '.join(text.split())

        return clean_text[:4000] if clean_text else "Webpage returned empty text content."
    except Exception as e:
        return f"Failed to fetch webpage '{url}': {str(e)}"


@tool
def get_weather(location: str) -> str:
    """
    Get live weather forecast and conditions for any city worldwide. 100% free, zero API key.
    """
    try:
        url = f"https://wttr.in/{location}?format=%l:+%C+%t+(feels+like+%f),+Humidity:+%h,+Wind:+%w"
        resp = requests.get(url, timeout=8)
        if resp.status_code == 200 and resp.text.strip():
            return f"Current weather: {resp.text.strip()}"
        return f"Could not retrieve weather for '{location}'."
    except Exception as e:
        return f"Weather lookup error: {str(e)}"


@tool
def get_crypto_prices(coins: str = "bitcoin,ethereum,solana") -> str:
    """
    Fetch real-time cryptocurrency prices in USD (e.g. bitcoin, ethereum, solana). Zero API key.
    """
    try:
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={coins.lower()}&vs_currencies=usd&include_24hr_change=true"
        resp = requests.get(url, timeout=8)
        data = resp.json()
        if not data:
            return "No price data returned."

        lines = []
        for coin, val in data.items():
            price = val.get("usd", 0)
            change = round(val.get("usd_24h_change", 0), 2)
            sign = "+" if change >= 0 else ""
            lines.append(f"- **{coin.title()}**: ${price:,.2f} ({sign}{change}% in 24h)")
        return "\n".join(lines)
    except Exception as e:
        return f"Crypto price error: {str(e)}"


@tool
def get_hacker_news_stories(limit: int = 5) -> str:
    """
    Fetch top trending tech headlines and discussions currently on Hacker News. Zero API key.
    """
    try:
        top_ids_url = "https://hacker-news.firebaseio.com/v0/topstories.json"
        ids = requests.get(top_ids_url, timeout=6).json()[:limit]

        stories = []
        for rank, sid in enumerate(ids, 1):
            item = requests.get(f"https://hacker-news.firebaseio.com/v0/item/{sid}.json", timeout=6).json()
            title = item.get("title", "No Title")
            url = item.get("url", f"https://news.ycombinator.com/item?id={sid}")
            score = item.get("score", 0)
            stories.append(f"{rank}. **{title}** ({score} points)\n   Link: {url}")

        return "\n\n".join(stories)
    except Exception as e:
        return f"Hacker News error: {str(e)}"


# =====================================================================
# 2. DESKTOP & SYSTEM CONTROL TOOLS (100% FREE & LOCAL)
# =====================================================================

@tool
def open_in_browser(url: str) -> str:
    """
    Open any website or URL directly in the user's default desktop browser.
    """
    try:
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url
        webbrowser.open(url)
        return f"Opened {url} in your default browser."
    except Exception as e:
        return f"Failed to open browser: {str(e)}"


@tool
def launch_application(app_name: str) -> str:
    """
    Launch common desktop applications on Windows:
    calc, notepad, code (VS Code), terminal, cmd, explorer, taskmgr, spotify, chrome.
    """
    safe_apps = {
        "calculator": "calc.exe",
        "calc": "calc.exe",
        "notepad": "notepad.exe",
        "vscode": "code",
        "code": "code",
        "terminal": "wt.exe",
        "cmd": "cmd.exe",
        "explorer": "explorer.exe",
        "task manager": "taskmgr.exe",
        "taskmgr": "taskmgr.exe",
        "spotify": "spotify.exe",
        "chrome": "chrome.exe"
    }
    target = safe_apps.get(app_name.lower().strip())
    if not target:
        return f"App '{app_name}' is not in allowed list: {', '.join(set(safe_apps.keys()))}."

    try:
        subprocess.Popen(target, shell=True)
        return f"Launched {app_name} successfully."
    except Exception as e:
        return f"Failed to launch {app_name}: {str(e)}"


@tool
def media_control(action: str) -> str:
    """
    Control computer media playback and volume.
    Allowed actions: 'playpause', 'volumeup', 'volumedown', 'volumemute', 'nexttrack', 'prevtrack'.
    """
    action_clean = action.lower().replace(" ", "").replace("_", "")
    key_mapping = {
        "playpause": "playpause",
        "play": "playpause",
        "pause": "playpause",
        "volumeup": "volumeup",
        "volumedown": "volumedown",
        "mute": "volumemute",
        "volumemute": "volumemute",
        "next": "nexttrack",
        "nexttrack": "nexttrack",
        "prev": "prevtrack",
        "prevtrack": "prevtrack",
        "previous": "prevtrack"
    }
    key = key_mapping.get(action_clean)
    if not key:
        return f"Unsupported media action '{action}'. Valid: playpause, volumeup, volumedown, mute, nexttrack, prevtrack."

    try:
        pyautogui.press(key)
        return f"Executed media command: {action}."
    except Exception as e:
        return f"Media control error: {str(e)}"


@tool
def lock_workstation() -> str:
    """
    Immediately lock the Windows computer screen for privacy/security.
    """
    try:
        ctypes.windll.user32.LockWorkStation()
        return "Windows workstation locked successfully."
    except Exception as e:
        return f"Failed to lock workstation: {str(e)}"


@tool
def list_running_processes(limit: int = 10) -> str:
    """
    List the top memory and CPU consuming processes running right now on the computer.
    """
    try:
        procs = []
        for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                info = p.info
                if info['name'] and info['memory_percent']:
                    procs.append(info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        # Sort by memory usage
        top_procs = sorted(procs, key=lambda x: x.get('memory_percent') or 0, reverse=True)[:limit]
        lines = [f"- **{p['name']}** (PID: {p['pid']}) — RAM: {round(p['memory_percent'], 1)}%, CPU: {p.get('cpu_percent') or 0}%" for p in top_procs]
        return "Top running processes:\n" + "\n".join(lines)
    except Exception as e:
        return f"Process list error: {str(e)}"


@tool
def kill_process(name_or_pid: str) -> str:
    """
    Safely terminate a frozen or unwanted application by process name or PID (e.g. 'notepad.exe' or '1234').
    """
    try:
        # Check if numeric PID
        if name_or_pid.isdigit():
            pid = int(name_or_pid)
            proc = psutil.Process(pid)
            name = proc.name()
            proc.terminate()
            return f"Terminated process '{name}' (PID: {pid})."

        # Search by process name
        killed = 0
        target = name_or_pid.lower()
        if not target.endswith(".exe"):
            target += ".exe"

        for p in psutil.process_iter(['name']):
            try:
                if p.info['name'] and p.info['name'].lower() == target:
                    p.terminate()
                    killed += 1
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        if killed > 0:
            return f"Successfully terminated {killed} instance(s) of '{name_or_pid}'."
        return f"No active processes found matching '{name_or_pid}'."
    except Exception as e:
        return f"Failed to kill process: {str(e)}"


@tool
def create_desktop_note(title: str, content: str) -> str:
    """
    Create a quick text or markdown note saved directly onto the user's Desktop.
    """
    try:
        desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
        if not os.path.exists(desktop_dir):
            desktop_dir = os.getcwd()

        clean_title = "".join(c for c in title if c.isalnum() or c in (" ", "_", "-")).strip()
        if not clean_title:
            clean_title = "Shrey_Note"
        filename = f"{clean_title}.md"
        filepath = os.path.join(desktop_dir, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"# {title}\n\n{content}\n\n---\n*Created by Shrey AI*\n")

        return f"Note successfully created on Desktop at: {filepath}"
    except Exception as e:
        return f"Failed to create note: {str(e)}"


@tool
def empty_recycle_bin() -> str:
    """
    Safely empty the Windows Recycle Bin to recover storage space.
    """
    try:
        cmd = 'powershell.exe -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"'
        subprocess.run(cmd, shell=True, timeout=10)
        return "Windows Recycle Bin has been emptied."
    except Exception as e:
        return f"Error emptying Recycle Bin: {str(e)}"


@tool
def get_system_info() -> str:
    """
    Retrieve real-time computer hardware telemetry:
    CPU usage, memory (RAM) allocation, disk storage, and battery level.
    """
    try:
        cpu_percent = psutil.cpu_percent(interval=0.5)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        info = [
            f"- **CPU Usage:** {cpu_percent}%",
            f"- **RAM Usage:** {memory.percent}% ({round(memory.used / (1024**3), 2)} GB / {round(memory.total / (1024**3), 2)} GB)",
            f"- **Disk Storage:** {disk.percent}% used ({round(disk.free / (1024**3), 2)} GB free)",
        ]

        battery = psutil.sensors_battery()
        if battery:
            plugged = "Plugged In" if battery.power_plugged else "On Battery"
            info.append(f"- **Battery:** {battery.percent}% ({plugged})")

        return "\n".join(info)
    except Exception as e:
        return f"System info error: {str(e)}"


@tool
def clipboard_read() -> str:
    """
    Read whatever text is currently stored in the user's OS clipboard.
    """
    try:
        text = pyperclip.paste()
        if not text:
            return "The clipboard is currently empty."
        return f"Clipboard contents:\n{text}"
    except Exception as e:
        return f"Clipboard read error: {str(e)}"


@tool
def clipboard_write(text: str) -> str:
    """
    Copy the given text directly to the user's OS clipboard.
    """
    try:
        pyperclip.copy(text)
        return "Text has been successfully copied to your clipboard."
    except Exception as e:
        return f"Clipboard write error: {str(e)}"


@tool
def take_screenshot() -> str:
    """
    Capture a screenshot of the entire computer screen and save it locally.
    Returns the file path of the saved screenshot image.
    """
    try:
        screenshots_dir = os.path.join(os.getcwd(), "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        filename = f"screenshot_{int(psutil.time.time())}.png"
        filepath = os.path.join(screenshots_dir, filename)
        screenshot = pyautogui.screenshot()
        screenshot.save(filepath)
        return f"Screenshot successfully saved to: {filepath}"
    except Exception as e:
        return f"Screenshot error: {str(e)}"


@tool
def read_local_file(file_path: str) -> str:
    """
    Read the contents of a local text file at the given file path.
    """
    try:
        if not os.path.isabs(file_path):
            file_path = os.path.abspath(file_path)
        if not os.path.exists(file_path):
            return f"Error: File '{file_path}' does not exist."
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read(4000)
        return f"File content of {file_path}:\n{content}"
    except Exception as e:
        return f"File read error: {str(e)}"


# =====================================================================
# EXPORT ALL TOOLS (16 TOTAL: WEB + DESKTOP + OS AUTOMATION)
# =====================================================================
ALL_TOOLS = [
    # Live Web Tools
    tavily_search,
    fetch_web_page,
    get_weather,
    get_crypto_prices,
    get_hacker_news_stories,
    open_in_browser,

    # Desktop & App Automation
    launch_application,
    media_control,
    lock_workstation,
    create_desktop_note,
    empty_recycle_bin,

    # Hardware & Process Diagnostics
    get_system_info,
    list_running_processes,
    kill_process,

    # Clipboard & Screen
    clipboard_read,
    clipboard_write,
    take_screenshot,
    read_local_file
]
