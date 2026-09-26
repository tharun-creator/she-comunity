from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "service": "she-stays-api"}


@router.get("/healthz", tags=["health"])
async def healthz():
    return {"status": "ok"}


@router.get("/ready", tags=["health"])
async def ready():
    # Could add database connectivity check here
    return {"status": "ready"}