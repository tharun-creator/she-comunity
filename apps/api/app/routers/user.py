from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from app.schemas.user import UserProfile, WomenAttestationRequest, UserMembership, UserMembershipsResponse
from app.middleware.auth import get_current_user, CurrentUser
from app.deps.supabase import get_supabase_client

router = APIRouter()


@router.get("/users/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get current user's profile."""
    supabase = get_supabase_client()

    result = supabase.from_("users").select("*").or_(f"id.eq.{current_user.user_id},auth_user_id.eq.{current_user.user_id}").limit(1).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    user_dict = dict(result.data[0] if isinstance(result.data, list) else result.data)

    # Get user joined PG ids
    memberships = supabase.from_("pg_memberships").select("pg_id").eq("user_id", user_dict["id"]).execute()
    user_dict["joined_pg_ids"] = [m["pg_id"] for m in (memberships.data or [])]
    user_dict.setdefault("saved_pg_ids", [])
    user_dict.setdefault("pgs_lived_at", [])

    return UserProfile(**user_dict)


@router.patch("/users/me/attest", response_model=UserProfile)
async def attest_woman(
    attestation: WomenAttestationRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Record women attestation."""
    supabase = get_supabase_client()

    if not attestation.attested:
        raise HTTPException(status_code=400, detail="Attestation must be true")

    # Update women_attested_at directly or call rpc
    try:
        supabase.rpc("attest_woman", {"user_id": current_user.user_id}).execute()
    except Exception:
        pass
    
    supabase.from_("users").update({"women_attested_at": "now()"}).or_(f"id.eq.{current_user.user_id},auth_user_id.eq.{current_user.user_id}").execute()

    # Return updated profile
    profile_result = supabase.from_("users").select("*").or_(f"id.eq.{current_user.user_id},auth_user_id.eq.{current_user.user_id}").limit(1).execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    user_dict = dict(profile_result.data[0] if isinstance(profile_result.data, list) else profile_result.data)
    memberships = supabase.from_("pg_memberships").select("pg_id").eq("user_id", user_dict["id"]).execute()
    user_dict["joined_pg_ids"] = [m["pg_id"] for m in (memberships.data or [])]
    user_dict.setdefault("saved_pg_ids", [])
    user_dict.setdefault("pgs_lived_at", [])

    return UserProfile(**user_dict)


@router.get("/users/me/pgs", response_model=UserMembershipsResponse)
async def get_user_pgs(
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get PGs the user has joined."""
    supabase = get_supabase_client()

    result = supabase.from_("pg_memberships").select("pg_id, joined_at, pgs!inner(name, area)").eq("user_id", current_user.user_id).execute()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    memberships = []
    for m in (result.data or []):
        pg = m.get("pgs")
        if pg:
            memberships.append(UserMembership(
                pg_id=m["pg_id"],
                pg_name=pg["name"],
                area=pg["area"],
                joined_at=m["joined_at"]
            ))

    return UserMembershipsResponse(data=memberships, next_cursor=None, has_more=False)


@router.post("/pgs/{pg_id}/join", response_model=UserMembership, status_code=status.HTTP_201_CREATED)
async def join_pg(
    pg_id: UUID,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Join a PG community."""
    supabase = get_supabase_client()

    # Check PG exists
    pg_result = supabase.from_("pgs").select("id, name, area").eq("id", str(pg_id)).single()
    if pg_result.error or not pg_result.data:
        raise HTTPException(status_code=404, detail="PG not found")

    pg = pg_result.data

    # Check if already a member
    membership = supabase.from_("pg_memberships").select("pg_id").eq("pg_id", str(pg_id)).eq("user_id", current_user.user_id).execute()
    if membership.data:
        raise HTTPException(status_code=409, detail="Already a member")

    # Create membership
    result = supabase.from_("pg_memberships").insert({
        "pg_id": str(pg_id),
        "user_id": current_user.user_id,
    }).select().single()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    return UserMembership(
        pg_id=pg_id,
        pg_name=pg["name"],
        area=pg["area"],
        joined_at=result.data["joined_at"]
    )


@router.delete("/pgs/{pg_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_pg(
    pg_id: UUID,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Leave a PG community."""
    supabase = get_supabase_client()

    # Check membership exists
    membership = supabase.from_("pg_memberships").select("pg_id").eq("pg_id", str(pg_id)).eq("user_id", current_user.user_id).execute()
    if not membership.data:
        raise HTTPException(status_code=404, detail="Not a member")

    # Delete membership
    result = supabase.from_("pg_memberships").delete().eq("pg_id", str(pg_id)).eq("user_id", current_user.user_id).execute()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    return None