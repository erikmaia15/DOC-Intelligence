export interface AiExtractionResult {
  documentType: string;
  extractedFields: Record<string, unknown>;
  suggestedFilename: string;
  confidenceScore: number;
}

export const AI_PORT = 'AI_PORT';

export interface AiPort {
  classifyAndExtract(fileBuffer: Buffer, mimeType: string): Promise<AiExtractionResult>;
}
