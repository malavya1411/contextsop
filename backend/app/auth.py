import base64
import json
import os
from functools import wraps

import requests
from flask import g, jsonify, request


def decode_jwt_payload(token):
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        payload_b64 = parts[1]
        # Pad payload base64 string if necessary
        payload_b64 += "=" * (-len(payload_b64) % 4)
        payload_json = base64.b64decode(payload_b64).decode("utf-8")
        return json.loads(payload_json)
    except Exception:
        return {}


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return (
                jsonify(
                    error="Unauthorized",
                    message="Missing or invalid authorization header.",
                ),
                401,
            )

        token = auth_header.split(" ")[1]

        supabase_url = os.getenv("SUPABASE_URL")
        supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

        if not supabase_url or not supabase_anon_key:
            return (
                jsonify(
                    error="Configuration Error",
                    message="Supabase credentials are not configured on the backend.",
                ),
                500,
            )

        try:
            # Verify session token against Supabase Auth API
            headers = {"Authorization": f"Bearer {token}", "apikey": supabase_anon_key}
            response = requests.get(f"{supabase_url}/auth/v1/user", headers=headers)

            if response.status_code != 200:
                return jsonify(error="Unauthorized", message="Invalid session token."), 401

            user_data = response.json()

            # Decode the token directly to read custom JWT claims (e.g. org_id hook claim)
            claims = decode_jwt_payload(token)

            # Extract organization ID from JWT claims, app_metadata, or user_metadata
            app_meta = user_data.get("app_metadata", {})
            user_meta = user_data.get("user_metadata", {})
            org_id = (
                claims.get("org_id")
                or app_meta.get("org_id")
                or user_meta.get("org_id")
            )

            if not org_id:
                return (
                    jsonify(
                        error="Forbidden",
                        message="User profile is not associated with an organization.",
                    ),
                    403,
                )

            # Assign user context to Flask thread-local 'g' context
            g.user_id = user_data.get("id")
            g.org_id = org_id
            g.user_email = user_data.get("email")

        except Exception as e:
            return (
                jsonify(
                    error="Internal Server Error",
                    message=f"An error occurred during authentication: {str(e)}",
                ),
                500,
            )

        return f(*args, **kwargs)

    return decorated
