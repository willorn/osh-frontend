#!/usr/bin/env python3
"""Patch built frontend for 25 test deploy: replace test host refs with same-origin /pc."""
import argparse
import glob
import os
import re
import sys

# Source refs baked into frontend build (useHttp / useWebSocket / useSeckillFetch)
SRC_HOST = "43.242.200.25"
NGINX_PORT = "58080"
BACKEND_PORT = "8081"


def patch_frontend_text(text):
    nginx_p = NGINX_PORT
    backend_p = BACKEND_PORT

    # HTTP API → same-origin /pc (nginx/higress → backend)
    text = re.sub(rf"https?://{re.escape(SRC_HOST)}:8081/pc", "/pc", text)
    text = re.sub(rf"https?://{re.escape(SRC_HOST)}:{backend_p}/pc", "/pc", text)
    text = re.sub(rf"https?://{re.escape(SRC_HOST)}:8081(?=[/\"'\\s])", "/pc", text)
    text = re.sub(rf"https?://{re.escape(SRC_HOST)}:{backend_p}(?=[/\"'\\s])", "/pc", text)
    text = re.sub(r"https?://localhost:8081/pc", "/pc", text)
    text = re.sub(r"https?://localhost:8081(?=[/\"'\\s])", "/pc", text)

    # WebSocket → nginx port on test host (osh-nginx proxies /ws)
    ws_dst = f"ws://{SRC_HOST}:{nginx_p}"
    text = re.sub(rf"wss?://{re.escape(SRC_HOST)}:8081", ws_dst, text)
    text = re.sub(rf"wss?://{re.escape(SRC_HOST)}:{backend_p}", ws_dst, text)
    text = re.sub(rf"'{re.escape(SRC_HOST)}:8081'", "'/pc'", text)
    text = re.sub(rf'"{re.escape(SRC_HOST)}:8081"', '"/pc"', text)
    text = text.replace(f"{SRC_HOST}:8081", "/pc")
    return text


def patch_frontend_dir(root):
    changed = 0
    for pattern in ("**/*.js", "**/*.html", "**/*.json"):
        for path in glob.glob(os.path.join(root, pattern), recursive=True):
            if "/node_modules/" in path:
                continue
            try:
                raw = open(path, encoding="utf-8", errors="ignore").read()
            except OSError:
                continue
            new = patch_frontend_text(raw)
            if new != raw:
                open(path, "w", encoding="utf-8").write(new)
                changed += 1
    return changed


def verify_no_hardcoded_backend(root):
    offenders = []
    for path in glob.glob(os.path.join(root, "**/*.js"), recursive=True):
        try:
            data = open(path, encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        if f"{SRC_HOST}:8081" in data:
            offenders.append(path)
    if offenders:
        sample = offenders[:5]
        raise SystemExit(f"still contains {SRC_HOST}:8081: {sample}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--frontend", required=True, help="frontend static output directory")
    args = parser.parse_args()

    n = patch_frontend_dir(args.frontend)
    verify_no_hardcoded_backend(args.frontend)
    print(f"patched {n} frontend files for test25")


if __name__ == "__main__":
    main()
