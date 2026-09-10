"""SheStays Community API — skeleton.

Not wired to a real database yet: the frontend (apps/web) currently runs entirely
against an in-memory mock (apps/web/src/lib/mock-data.ts) so the product can be
demoed and iterated on before Supabase credentials exist. Routers below are stubs
matching the schema in docs/schema.sql; fill them in once a Supabase project is
connected (see the repo root README for what's needed).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SheStays Community API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# TODO once Supabase is connected:
# - GET  /pgs, /pgs/search, POST /pgs
# - GET  /pgs/{id}/posts, POST /pgs/{id}/posts
# - GET  /posts/{id}/comments, POST /posts/{id}/comments
# - POST /posts/{id}/vote, POST /comments/{id}/vote
# - POST /reports
# - GET  /notifications
# Every write endpoint must enforce the rate limits from PRD.md §5.5 server-side —
# do not trust the client to have checked them first.
