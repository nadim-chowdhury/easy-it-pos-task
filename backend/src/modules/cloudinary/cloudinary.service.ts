import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<string> {
    try {
      this.validateFile(file);

      const uploadResult = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'image',
              transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto' },
              ],
            },
            (error, result) => {
              if (error) {
                this.logger.error('Cloudinary upload error:', error);
                reject(new Error(error.message || 'Cloudinary upload failed'));
              } else if (result) {
                resolve(result);
              } else {
                reject(new Error('Unknown Cloudinary error'));
              }
            },
          );

          uploadStream.end(file.buffer);
        },
      );

      this.logger.log(`Image uploaded successfully: ${uploadResult.public_id}`);
      return uploadResult.secure_url;
    } catch (error) {
      this.logger.error('Error uploading image to Cloudinary', error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'products',
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 images allowed');
    }

    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicIdFromUrl(imageUrl);
      if (!publicId) {
        this.logger.warn(`Invalid Cloudinary URL format: ${imageUrl}`);
        return;
      }

      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted successfully: ${publicId}`);
    } catch (error) {
      this.logger.error(`Error deleting image: ${imageUrl}`, error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  async deleteMultipleImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map((url) => this.deleteImage(url));
    await Promise.allSettled(deletePromises);
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum size: ${maxFileSize / (1024 * 1024)}MB`,
      );
    }
  }

  private extractPublicIdFromUrl(url: string): string | null {
    try {
      // Extract public_id from Cloudinary URL
      // Example: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/image.jpg
      const matches = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|webp)$/);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }
}
