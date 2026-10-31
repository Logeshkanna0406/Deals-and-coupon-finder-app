package com.example.couponservice.dto;

import com.example.couponservice.entity.CouponStatus;
import java.math.BigDecimal;

public class CouponReliabilityResponse {
    private Long couponId;
    private Integer upvoteCount;
    private Integer downvoteCount;
    private Integer totalVotes;
    private BigDecimal reliabilityScore;
    private Integer minimumVotesRequired;
    private CouponStatus status;

    public CouponReliabilityResponse() {}

    public CouponReliabilityResponse(Long couponId, Integer upvoteCount, Integer downvoteCount,
                                     Integer totalVotes, BigDecimal reliabilityScore,
                                     Integer minimumVotesRequired, CouponStatus status) {
        this.couponId = couponId;
        this.upvoteCount = upvoteCount;
        this.downvoteCount = downvoteCount;
        this.totalVotes = totalVotes;
        this.reliabilityScore = reliabilityScore;
        this.minimumVotesRequired = minimumVotesRequired;
        this.status = status;
    }

    public Long getCouponId() { return couponId; }
    public void setCouponId(Long couponId) { this.couponId = couponId; }

    public Integer getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(Integer upvoteCount) { this.upvoteCount = upvoteCount; }

    public Integer getDownvoteCount() { return downvoteCount; }
    public void setDownvoteCount(Integer downvoteCount) { this.downvoteCount = downvoteCount; }

    public Integer getTotalVotes() { return totalVotes; }
    public void setTotalVotes(Integer totalVotes) { this.totalVotes = totalVotes; }

    public BigDecimal getReliabilityScore() { return reliabilityScore; }
    public void setReliabilityScore(BigDecimal reliabilityScore) { this.reliabilityScore = reliabilityScore; }

    public Integer getMinimumVotesRequired() { return minimumVotesRequired; }
    public void setMinimumVotesRequired(Integer minimumVotesRequired) { this.minimumVotesRequired = minimumVotesRequired; }

    public CouponStatus getStatus() { return status; }
    public void setStatus(CouponStatus status) { this.status = status; }
}
