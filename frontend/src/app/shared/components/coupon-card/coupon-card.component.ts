import { Component, EventEmitter, Input, OnInit, OnChanges, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CouponResponse, VoteType } from '../../../core/models/coupon.models';
import { CouponService } from '../../../core/services/coupon.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-coupon-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './coupon-card.component.html',
  styleUrl: './coupon-card.component.css'
})
export class CouponCardComponent implements OnInit, OnChanges {
  private readonly couponService = inject(CouponService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) coupon!: CouponResponse;
  @Input() merchantName?: string;
  @Input() isFeatured = false;
  @Input() isClaimed = false;

  @Output() redeem = new EventEmitter<CouponResponse>();

  copied = false;
  userVote: VoteType | null = null;
  isVoting = false;

  ngOnInit(): void {
    this.refreshUserVote();
  }

  ngOnChanges(): void {
    this.refreshUserVote();
  }

  private refreshUserVote(): void {
    if (this.coupon?.couponId) {
      this.userVote = this.couponService.getUserVote(this.coupon.couponId);
    }
  }

  onVote(event: Event, type: VoteType): void {
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please log in to vote on coupon reliability.', 'Login Required');
      this.router.navigate(['/login']);
      return;
    }

    if (this.isVoting || !this.coupon?.couponId) return;

    this.isVoting = true;
    const targetCouponId = this.coupon.couponId;

    this.couponService.castVote(targetCouponId, { voteType: type }).subscribe({
      next: res => {
        this.isVoting = false;
        this.userVote = type;

        if (res) {
          if (res.upvoteCount != null) this.coupon.upvoteCount = res.upvoteCount;
          if (res.downvoteCount != null) this.coupon.downvoteCount = res.downvoteCount;
          if (res.totalVotes != null) this.coupon.totalVotes = res.totalVotes;
          if (res.reliabilityScore != null) this.coupon.reliabilityScore = res.reliabilityScore;
        }

        this.toast.success(
          type === 'UPVOTE'
            ? 'Upvoted! Marked as working (+1).'
            : 'Downvoted! Marked as not working.',
          'Vote Recorded'
        );
        this.cdr.markForCheck();
      },
      error: err => {
        this.isVoting = false;
        const msg = err.error?.message || 'Only customers who have redeemed this coupon can vote (Rule 18).';
        this.toast.warning(msg, 'Voting Eligibility');
        this.cdr.markForCheck();
      }
    });
  }

  copyCode(event: Event): void {
    event.stopPropagation();
    if (this.coupon?.couponCode) {
      navigator.clipboard.writeText(this.coupon.couponCode).then(() => {
        this.copied = true;
        this.toast.success(`Coupon code "${this.coupon.couponCode}" copied to clipboard!`, 'Code Copied');
        setTimeout(() => {
          this.copied = false;
        }, 2500);
      }).catch(() => {
        this.toast.info(`Coupon code: ${this.coupon.couponCode}`);
      });
    }
  }

  onRedeemClick(event: Event): void {
    event.stopPropagation();
    if (this.isClaimed) {
      this.toast.info('You have already claimed this deal. View your code in My Redemptions.', 'Deal Already Claimed');
      this.router.navigate(['/customer/redemptions']);
      return;
    }
    this.redeem.emit(this.coupon);
  }

  hasVotes(): boolean {
    const up = this.coupon?.upvoteCount || 0;
    const down = this.coupon?.downvoteCount || 0;
    return (up + down) > 0;
  }

  getReliabilityPercent(): number {
    const up = this.coupon?.upvoteCount || 0;
    const down = this.coupon?.downvoteCount || 0;
    const total = up + down;
    if (total === 0) return 100;
    return Math.round((up / total) * 100);
  }

  getStarRating(): string {
    const up = this.coupon?.upvoteCount || 0;
    const down = this.coupon?.downvoteCount || 0;
    const total = up + down;
    if (total === 0) return '☆☆☆☆☆';
    const pct = Math.round((up / total) * 100);
    if (pct >= 85) return '★★★★★';
    if (pct >= 65) return '★★★★☆';
    if (pct >= 45) return '★★★☆☆';
    if (pct >= 25) return '★★☆☆☆';
    return '★☆☆☆☆';
  }

  getReliabilityTooltip(): string {
    const up = this.coupon?.upvoteCount || 0;
    const down = this.coupon?.downvoteCount || 0;
    const total = up + down;
    if (total === 0) return 'New deal — No community votes yet';
    return `${this.getReliabilityPercent()}% reliability based on ${total} vote(s) (${up} worked, ${down} failed)`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Limited time';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
