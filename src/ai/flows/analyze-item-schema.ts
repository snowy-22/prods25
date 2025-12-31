import { z } from 'zod';

export const ItemAnalysisInputSchema = z.object({
  imageUri: z.string().describe("A data URI of the product image to be analyzed. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ItemAnalysisInput = z.infer<typeof ItemAnalysisInputSchema>;

export const ItemAnalysisOutputSchema = z.object({
  title: z.string().describe('The full name of the identified product.'),
  description: z.string().describe('A detailed description of the product, including its features and purpose.'),
  category: z.string().optional().describe('The product category (e.g., Electronics, Clothing, Food).'),
  brand: z.string().optional().describe('The brand name of the product.'),
  barcode: z.string().optional().describe('The barcode number detected on the product (EAN, UPC, etc.).'),
  sku: z.string().optional().describe('SKU or product code if visible.'),
  imageUrl: z.string().url().optional().describe('A URL of a high-quality product image found on the web.'),
  webEntities: z.array(z.object({
    description: z.string().describe('A web entity description related to the product.'),
    score: z.number().describe('Confidence score for this entity (0-1).'),
  })).optional().describe('Related web entities detected through image analysis.'),
  detectedLabels: z.array(z.string()).optional().describe('Labels detected in the image (e.g., "bottle", "electronic device").'),
  priceLinks: z.array(z.object({
    source: z.string().describe('The name of the e-commerce store (e.g., Amazon, Hepsiburada).'),
    url: z.string().url().describe('The direct URL to the product page.'),
    price: z.string().optional().describe('The price of the product as a string, including currency.'),
  })).optional().describe('A list of links to product pages on e-commerce sites.'),
  reviewVideos: z.array(z.object({
    title: z.string().describe('The title of the YouTube review video.'),
    url: z.string().url().describe('The URL of the YouTube video.'),
  })).optional().describe('A list of YouTube review videos for the product.'),
});
export type ItemAnalysisOutput = z.infer<typeof ItemAnalysisOutputSchema>;
