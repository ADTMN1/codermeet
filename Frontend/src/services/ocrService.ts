// services/ocrService.ts
import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  transactionId?: string;
  amount?: string;
  timestamp?: string;
}

export class OCRService {
  private static instance: OCRService;

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Extract transaction information from payment screenshot
   */
  async extractTransactionInfo(imageFile: File): Promise<OCRResult> {
    try {
      console.log('Starting OCR processing for image:', imageFile.name);

      // Configure Tesseract for better accuracy
      const result = await Tesseract.recognize(
        imageFile,
        'eng', // English language
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          },
        }
      );

      console.log('OCR Raw Result:', result.data.text);

      // Extract transaction details from OCR text
      const extractedData = this.parseTransactionData(result.data.text);

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        ...extractedData
      };

    } catch (error) {
      console.error('OCR Processing Error:', error);
      throw new Error('Failed to process payment screenshot. Please ensure the image is clear and contains transaction details.');
    }
  }

  /**
   * Parse transaction data from OCR text
   */
  private parseTransactionData(ocrText: string): Partial<OCRResult> {
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let transactionId: string | undefined;
    let amount: string | undefined;
    let timestamp: string | undefined;

    // Common patterns for Ethiopian payment systems
    const patterns = {
      // Transaction ID patterns (various formats)
      transactionId: [
        // CBE Ref No pattern (most specific)
        /(?:Ref\s*No|Ref\s*No\.|Reference\s*No)[:\s]*([A-Z]{2}\d{8,}[A-Z0-9]*)/i,
        /(?:Ref\s*No|Ref\s*No\.|Reference\s*No)[:\s]*([A-Z]{2}\d{8,})/i,
        // CBE URL pattern
        /id=([A-Z]{2}\d{8,}[A-Z0-9]*)/i,
        /id=([A-Z]{2}\d{8,})/i,
        // General Ref patterns
        /(?:Transaction\s*ID|Txn\s*ID|Ref(?:erence)?|Ref\s*No|Payment\s*ID|TRX)[:\s]*([A-Z0-9]{6,})/i,
        // CBE specific patterns
        /(?:CBE)\s*.*?([A-Z]{2}\d{8,}[A-Z0-9]*)/i,
        /(?:CBE)\s*.*?([A-Z]{2}\d{8,})/i,
        // General alphanumeric pattern (longer)
        /([A-Z0-9]{10,})/, 
        // Long numeric pattern
        /(\d{10,})/,
      ],
      
      // Amount patterns
      amount: [
        /(?:Amount|Paid|Total|Birr|ETB)[:\s]*([\d,]+\.?\d*)/i,
        /([\d,]+\.?\d*)\s*(?:Birr|ETB)/i,
        /(?:Birr|ETB)\s*([\d,]+\.?\d*)/i,
      ],
      
      // Timestamp patterns
      timestamp: [
        /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
        /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/, // YYYY/MM/DD or YYYY-MM-DD
        /(\d{2}:\d{2}(?::\d{2})?)/, // Time
        /(\d{2}[\/\-]\d{2}[\/\-]\d{4}\s+\d{2}:\d{2})/, // Date and time
      ]
    };

    // Extract transaction ID
    for (const pattern of patterns.transactionId) {
      for (const line of lines) {
        const match = line.match(pattern);
        if (match && match[1]) {
          transactionId = match[1].trim();
          break;
        }
      }
      if (transactionId) break;
    }

    // Extract amount
    for (const pattern of patterns.amount) {
      for (const line of lines) {
        const match = line.match(pattern);
        if (match && match[1]) {
          amount = match[1].trim();
          break;
        }
      }
      if (amount) break;
    }

    // Extract timestamp
    for (const pattern of patterns.timestamp) {
      for (const line of lines) {
        const match = line.match(pattern);
        if (match && match[1]) {
          timestamp = match[1].trim();
          break;
        }
      }
      if (timestamp) break;
    }

    return {
      transactionId,
      amount,
      timestamp
    };
  }

  /**
   * Validate extracted transaction ID
   */
  validateTransactionId(transactionId: string): boolean {
    // Basic validation for transaction ID
    if (!transactionId || transactionId.length < 6) {
      return false;
    }
    
    // Should contain at least one letter or number
    return /[A-Za-z0-9]/.test(transactionId);
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image
        ctx?.drawImage(img, 0, 0);

        // Apply image enhancements for better OCR
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Increase contrast and brightness
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const enhanced = gray > 128 ? 255 : 0; // Binarization
            data[i] = enhanced;     // Red
            data[i + 1] = enhanced; // Green
            data[i + 2] = enhanced; // Blue
          }

          ctx.putImageData(imageData, 0, 0);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to process image'));
          }
        }, 'image/jpeg', 0.9);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

export default OCRService;
