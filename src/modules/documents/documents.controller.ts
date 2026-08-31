import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service.js';
import { GetDocumentsQueryDto } from './dto/get-documents.dto.js';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload e extração de documento', description: 'Envia um arquivo multipart/form-data (Fato b), calcula o hash (Fato c) e envia para a IA assincronamente (Fato a).' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Documento criado e em processamento.' })
  @ApiResponse({ status: 400, description: 'Erro de validação (tamanho ou mimeType inválidos).' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (file && file.originalname) {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    }
    return this.documentsService.uploadAndCreate(file);
  }

  @Get()
  @ApiOperation({ summary: 'Listar documentos', description: 'Retorna a lista de documentos processados ou em processamento.' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  async getDocuments(@Query() query: GetDocumentsQueryDto) {
    return this.documentsService.findMany(query.status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do documento', description: 'Retorna o documento e os campos extraídos, se houver.' })
  @ApiResponse({ status: 200, description: 'Documento retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado.' })
  async getDocumentById(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }
}
