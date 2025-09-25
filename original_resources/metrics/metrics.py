"""Metrics"""
import json

PERMISSIONS = ["activeTab", "alarms", "background", "bookmarks", "browsingData",
               "certificateProvider", "clipboardRead", "clipboardWrite", "contentSettings",
               "contextMenus", "cookies", "debugger", "declarativeContent", "declarativeNetRequest",
               "declarativeNetRequestWithHostAccess", "declarativeNetRequestFeedback",
               "desktopCapture", "documentScan", "downloads", "downloads.open", "downloads.ui",
               "enterprise.deviceAttributes", "enterprise.hardwarePlatform",
               "enterprise.networkingAttributes", "enterprise.platformKeys", "experimental",
               "fileBrowserHandler", "fileSystemProvider", "fontSettings", "gcm", "geolocation",
               "history", "identity", "idle", "loginState", "management", "nativeMessaging",
               "notifications", "offscreen", "pageCapture", "platformKeys", "power",
               "printerProvider", "printing", "printingMetrics", "privacy", "processes", "proxy",
               "scripting", "search", "sessions", "sidePanel", "storage", "system.cpu",
               "system.display", "system.memory", "system.storage", "tabCapture", "tabGroups",
               "tabs", "topSites", "tts", "ttsEngine", "unlimitedStorage", "vpnProvider",
               "wallpaper", "webAuthenticationProxy", "webNavigation", "webRequest",
               "webRequestBlocking"]

def init(path: str):
    """Initalizes the metrics."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    global DESCRIPTION, SUMMARY, REVIEWS, CONTENT_MATCHES, HOST_PERMISSIONS
    DESCRIPTION = data["description"]
    SUMMARY = data["fullSummary"]
    REVIEWS = data["reviews"]
    CONTENT_MATCHES = data["contentScriptMatches"]
    HOST_PERMISSIONS = data["hostPermissions"]
