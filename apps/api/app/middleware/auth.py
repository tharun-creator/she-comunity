import jwt
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.deps.supabase import get_supabase_client


security = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(self, user_id: str, email: str):
        self.user_id = user_id
        self.email = email


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> CurrentUser:
    """Validate Supabase JWT and return current user."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = credentials.credentials

    try:
        # Verify JWT with Supabase
        supabase = get_supabase_client()
        response = supabase.auth.get_user(token)

        if response.user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        return CurrentUser(user_id=response.user.id, email=response.user.email or "")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> CurrentUser | None:
    """Get current user if token is valid, otherwise return None."""
    if not credentials:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None