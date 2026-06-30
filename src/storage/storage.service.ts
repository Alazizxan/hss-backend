import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
    private s3 = new S3Client({
        region: process.env.AWS_REGION,
        endpoint: process.env.AWS_ENDPOINT,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
    });

    async uploadFile(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File required');
        }

        const ext = file.originalname.toLowerCase();

        const isVideo =
            file.mimetype.startsWith('video/') ||
            ['.mp4', '.mov', '.avi', '.mkv', '.webm'].some(e => ext.endsWith(e));

        const isImage =
            file.mimetype.startsWith('image/') ||
            ['.png', '.jpg', '.jpeg', '.webp', '.gif'].some(e => ext.endsWith(e));

        if (!isVideo && !isImage) {
            throw new BadRequestException('Only image/video allowed');
        }

        let contentType = file.mimetype;

        // curl yoki ba'zi mobil qurilmalar application/octet-stream yuboradi
        if (contentType === 'application/octet-stream') {
            if (ext.endsWith('.mp4')) contentType = 'video/mp4';
            else if (ext.endsWith('.mov')) contentType = 'video/quicktime';
            else if (ext.endsWith('.webm')) contentType = 'video/webm';
            else if (ext.endsWith('.avi')) contentType = 'video/x-msvideo';
            else if (ext.endsWith('.mkv')) contentType = 'video/x-matroska';

            else if (ext.endsWith('.png')) contentType = 'image/png';
            else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) contentType = 'image/jpeg';
            else if (ext.endsWith('.webp')) contentType = 'image/webp';
            else if (ext.endsWith('.gif')) contentType = 'image/gif';
        }

        const folder = isVideo ? 'videos' : 'images';
        const key = `${folder}/${Date.now()}-${file.originalname}`;

        await this.s3.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
                Body: file.buffer,
                ContentType: contentType,
            }),
        );

        return {
            success: true,
            url: `${process.env.R2_PUBLIC_URL}/${key}`,
            key,
            type: isVideo ? 'video' : 'image',
            contentType,
        };
    }
}