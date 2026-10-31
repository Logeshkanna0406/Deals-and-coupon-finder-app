package com.example.couponservice.dto;

import com.example.couponservice.entity.VoteType;
import jakarta.validation.constraints.NotNull;

public class VoteRequest {

    @NotNull(message = "Vote type is required (UPVOTE or DOWNVOTE)")
    private VoteType voteType;

    private Long customerId;

    public VoteRequest() {}

    public VoteRequest(VoteType voteType) {
        this.voteType = voteType;
    }

    public VoteRequest(VoteType voteType, Long customerId) {
        this.voteType = voteType;
        this.customerId = customerId;
    }

    public VoteType getVoteType() { return voteType; }
    public void setVoteType(VoteType voteType) { this.voteType = voteType; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
}
