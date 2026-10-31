package com.example.couponservice.dto;

import com.example.couponservice.entity.CouponStatus;
import com.example.couponservice.entity.VoteType;
import java.math.BigDecimal;

public class VoteResponse {
    private Long couponId;
    private Long customerId;
    private VoteType voteType;
    private Integer upvoteCount;
    private Integer downvoteCount;
    private Integer totalVotes;
    private BigDecimal reliabilityScore;
    private CouponStatus status;
    private String message;

    public VoteResponse() {}

    public VoteResponse(Long couponId, Long customerId, VoteType voteType, Integer upvoteCount,
                        Integer downvoteCount, Integer totalVotes, BigDecimal reliabilityScore,
                        CouponStatus status, String message) {
        this.couponId = couponId;
        this.customerId = customerId;
        this.voteType = voteType;
        this.upvoteCount = upvoteCount;
        this.downvoteCount = downvoteCount;
        this.totalVotes = totalVotes;
        this.reliabilityScore = reliabilityScore;
        this.status = status;
        this.message = message;
    }

    public Long getCouponId() { return couponId; }
    public void setCouponId(Long couponId) { this.couponId = couponId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public VoteType getVoteType() { return voteType; }
    public void setVoteType(VoteType voteType) { this.voteType = voteType; }

    public Integer getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(Integer upvoteCount) { this.upvoteCount = upvoteCount; }

    public Integer getDownvoteCount() { return downvoteCount; }
    public void setDownvoteCount(Integer downvoteCount) { this.downvoteCount = downvoteCount; }

    public Integer getTotalVotes() { return totalVotes; }
    public void setTotalVotes(Integer totalVotes) { this.totalVotes = totalVotes; }

    public BigDecimal getReliabilityScore() { return reliabilityScore; }
    public void setReliabilityScore(BigDecimal reliabilityScore) { this.reliabilityScore = reliabilityScore; }

    public CouponStatus getStatus() { return status; }
    public void setStatus(CouponStatus status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
