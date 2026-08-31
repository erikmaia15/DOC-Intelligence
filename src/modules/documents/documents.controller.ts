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

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (file && file.originalname) {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    }
    return this.documentsService.uploadAndCreate(file);
  }

  @Get()
  async getDocuments(@Query() query: GetDocumentsQueryDto) {
    return this.documentsService.findMany(query.status);
  }

  @Get(':id')
  async getDocumentById(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }
}
