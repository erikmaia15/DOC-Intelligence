import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ReviewService } from './review.service.js';
import { ClaimDocumentDto } from './dto/claim-document.dto.js';
import { CorrectDocumentDto } from './dto/correct-document.dto.js';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Review Queue')
@Controller('review-queue')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @ApiOperation({ summary: 'Listar documentos para revisão', description: 'Lista documentos com status NEEDS_REVIEW que não estão travados (Fato g).' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  async getQueue() {
    return this.reviewService.listReviewQueue();
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Reivindicar documento', description: 'Trava o documento por 5 minutos para revisão. Retorna 409 se outro revisor já estiver com a trava (Fato g).' })
  @ApiResponse({ status: 201, description: 'Trava efetuada/renovada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado ou não precisa de revisão.' })
  @ApiResponse({ status: 409, description: 'Conflito: já travado por outro revisor.' })
  async claim(@Param('id') id: string, @Body() dto: ClaimDocumentDto) {
    return this.reviewService.claimDocument(id, dto);
  }

  @Post(':id/correct')
  @ApiOperation({ summary: 'Corrigir documento', description: 'Salva os campos corrigidos e altera o status para READY. Exige que a trava seja sua.' })
  @ApiResponse({ status: 201, description: 'Documento corrigido e finalizado.' })
  @ApiResponse({ status: 403, description: 'Proibido: trava pertence a outro revisor.' })
  @ApiResponse({ status: 404, description: 'Não há trava ativa (expirou ou não existe).' })
  async correct(@Param('id') id: string, @Body() dto: CorrectDocumentDto) {
    return this.reviewService.correctDocument(id, dto);
  }
}
