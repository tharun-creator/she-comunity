from pydantic import BaseModel, Field
from typing import Literal, Optional


class VoteRequest(BaseModel):
    direction: Literal[1, -1, 0]  # 1=upvote, -1=downvote, 0=remove vote


class PollVoteRequest(BaseModel):
    option_id: str


class VoteResponse(BaseModel):
    upvotes: int
    downvotes: int
    my_vote: int


class PollVoteResponse(BaseModel):
    poll_options: list[dict]  # [{id, label, vote_count, is_my_vote}]
    my_poll_vote: Optional[str] = None