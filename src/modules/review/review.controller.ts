import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ReviewService } from './review.service.js';
import { ClaimDocumentDto } from './dto/claim-document.dto.js';
import { CorrectDocumentDto } from './dto/correct-document.dto.js';

@Controller('review-queue')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async getQueue() {
    return this.reviewService.listReviewQueue();
  }

  @Post(':id/claim')
  async claim(@Param('id') id: string, @Body() dto: ClaimDocumentDto) {
    return this.reviewService.claimDocument(id, dto);
  }

  @Post(':id/correct')
  async correct(@Param('id') id: string, @Body() dto: CorrectDocumentDto) {
    return this.reviewService.correctDocument(id, dto);
  }
}
