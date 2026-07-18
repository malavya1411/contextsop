import os
import sys

import requests
from dotenv import load_dotenv


# Use basic terminal coloring helper
class Color:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    BOLD = "\033[1m"
    END = "\033[0m"


def log_success(msg):
    print(f"[{Color.GREEN} OK {Color.END}] {msg}")


def log_warning(msg):
    print(f"[{Color.YELLOW}WARN{Color.END}] {msg}")


def log_fail(msg):
    print(f"[{Color.RED}FAIL{Color.END}] {msg}")


def check_env_file(path, required_keys, optional_keys=None):
    if not os.path.exists(path):
        log_fail(f"File not found: '{path}'")
        return False

    if optional_keys is None:
        optional_keys = []

    log_success(f"Found environment file: '{path}'")
    # Load env manually to check keys
    env_vars = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            env_vars[key.strip()] = val.strip()

    all_keys_exist = True
    for key in required_keys:
        val = env_vars.get(key)
        if not val:
            log_fail(f"  Missing required environment variable: '{key}'")
            all_keys_exist = False
        else:
            # Mask sensitive values
            if any(s in key.lower() for s in ["key", "secret", "url"]):
                masked = val[:10] + "..." if len(val) > 10 else "..."
                log_success(f"  Verified variable '{key}' = {masked}")
            else:
                log_success(f"  Verified variable '{key}' = {val}")

    for key in optional_keys:
        val = env_vars.get(key)
        if not val:
            log_warning(f"  Missing optional environment variable: '{key}' (not critical)")
        else:
            log_success(f"  Verified optional variable '{key}' = {val}")

    return all_keys_exist


def run_diagnostics():
    print(f"{Color.BOLD}=== Running ContextSOP Workspace Diagnostics (Phase R-11) ==={Color.END}\n")

    errors = 0
    warnings = 0

    # 1. Audit Backend Env
    print(f"{Color.BLUE}1. Auditing Backend Environment Configuration...{Color.END}")
    backend_env = "c:/project/contextsop/backend/.env"
    backend_required = [
        "FLASK_ENV",
        "FLASK_SECRET_KEY",
        "OPENAI_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "FRONTEND_ORIGIN",
    ]
    backend_optional = ["DATABASE_URL"]
    if not check_env_file(backend_env, backend_required, backend_optional):
        errors += 1
    print()

    # 2. Audit Frontend Env
    print(f"{Color.BLUE}2. Auditing Frontend Environment Configuration...{Color.END}")
    frontend_env = "c:/project/contextsop/frontend/.env.local"
    frontend_keys = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "NEXT_PUBLIC_API_URL",
    ]
    if not check_env_file(frontend_env, frontend_keys):
        log_warning(
            "Frontend environment variables check failed. "
            "Verify they are set in terminal if not using .env.local."
        )
        warnings += 1
    print()

    # 3. Check Flask Server Status
    print(f"{Color.BLUE}3. Checking Flask Backend Server Status...{Color.END}")
    try:
        res = requests.get("http://localhost:8080/api/v1/health", timeout=5)
        if res.status_code == 200:
            log_success(f"Flask backend server is running and healthy: {res.json()}")
        else:
            log_fail(f"Flask health endpoint returned status code {res.status_code}: {res.text}")
            errors += 1
    except requests.exceptions.RequestException as e:
        log_fail(f"Cannot connect to Flask server on port 8080: {e}")
        errors += 1
    print()

    # 4. Check Next.js Server Status
    print(f"{Color.BLUE}4. Checking Next.js Frontend Server Status...{Color.END}")
    try:
        res = requests.get("http://localhost:3000", timeout=5)
        if res.status_code in (200, 304, 302, 307):
            log_success(
                f"Next.js frontend server is running on port 3000 (status: {res.status_code})"
            )
        else:
            log_warning(f"Next.js server returned unexpected status code {res.status_code}")
            warnings += 1
    except requests.exceptions.RequestException as e:
        log_fail(f"Cannot connect to Next.js frontend server on port 3000: {e}")
        errors += 1
    print()

    # 5. Check Supabase Connectivity
    print(f"{Color.BLUE}5. Checking Supabase Database Connectivity...{Color.END}")
    load_dotenv(backend_env)
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    if url and key:
        try:
            # Query standard REST endpoint with anon key headers (which is allowed and returns 200)
            headers = {
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            }
            res = requests.get(f"{url}/rest/v1/sops", headers=headers, timeout=5)
            if res.status_code == 200:
                log_success(
                    "Successfully connected and authenticated to Supabase REST database endpoint."
                )
            else:
                log_fail(f"Supabase REST query returned status code {res.status_code}: {res.text}")
                errors += 1
        except requests.exceptions.RequestException as e:
            log_fail(f"Supabase connection test failed: {e}")
            errors += 1
    else:
        log_fail("Skipping Supabase connection check: credentials not found in env.")
        errors += 1
    print()

    # Summary
    print(f"{Color.BOLD}=== Diagnostic Run Summary ==={Color.END}")
    if errors == 0:
        if warnings == 0:
            print(
                f"{Color.GREEN}All checks passed successfully! The workspace environment "
                f"is healthy.{Color.END}"
            )
            sys.exit(0)
        else:
            print(
                f"{Color.YELLOW}All critical checks passed, but found {warnings} warnings. "
                f"Check output details.{Color.END}"
            )
            sys.exit(0)
    else:
        print(
            f"{Color.RED}Diagnostic run failed with {errors} errors and {warnings} warnings. "
            f"Please fix configuration gaps.{Color.END}"
        )
        sys.exit(1)


if __name__ == "__main__":
    run_diagnostics()
