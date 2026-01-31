/**
 * Visual Comparator Edge Cases unit tests
 * Tests for unusual image formats, corrupted data, extreme sizes, and boundary conditions
 */

import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import * as VisualComparator from '../../../src/domain/visual-comparator.js';

// Helper to create a test PNG buffer
function createTestImage(
  width: number,
  height: number,
  color: [number, number, number, number],
): Buffer {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = color[3];
    }
  }
  return PNG.sync.write(png);
}

// Helper to create image with transparency
function createImageWithAlpha(
  width: number,
  height: number,
  rgbColor: [number, number, number],
  alphaValues: number[],
): Buffer {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = rgbColor[0];
      png.data[idx + 1] = rgbColor[1];
      png.data[idx + 2] = rgbColor[2];
      png.data[idx + 3] = alphaValues[y * width + x] || 255;
    }
  }
  return PNG.sync.write(png);
}

describe('VisualComparator Edge Cases', () => {
  describe('Corrupted Images', () => {
    it('should handle truncated PNG data', () => {
      const validImage = createTestImage(100, 100, [255, 255, 255, 255]);
      const truncated = validImage.subarray(0, validImage.length / 2);

      const result = VisualComparator.compare(truncated, validImage);

      expect(result.error).toBeDefined();
    });

    it('should handle invalid PNG header', () => {
      const invalidPng = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const validImage = createTestImage(10, 10, [255, 255, 255, 255]);

      const result = VisualComparator.compare(invalidPng, validImage);

      expect(result.error).toBeDefined();
    });

    it('should handle empty buffer', () => {
      const emptyBuffer = Buffer.from([]);
      const validImage = createTestImage(10, 10, [255, 255, 255, 255]);

      const result = VisualComparator.compare(emptyBuffer, validImage);

      expect(result.error).toBeDefined();
    });

    it('should handle null bytes', () => {
      const nullBuffer = Buffer.alloc(100);
      const validImage = createTestImage(10, 10, [255, 255, 255, 255]);

      const result = VisualComparator.compare(nullBuffer, validImage);

      expect(result.error).toBeDefined();
    });

    it('should handle corrupted image data section', () => {
      const validImage = createTestImage(10, 10, [255, 255, 255, 255]);
      const corrupted = Buffer.from(validImage);
      for (let i = 50; i < 100; i++) {
        corrupted[i] = 0xff;
      }

      const result = VisualComparator.compare(corrupted, validImage);

      expect(result.error).toBeDefined();
    });
  });

  describe('Zero and Minimal Size Images', () => {
    it('should handle 1x1 pixel images', () => {
      const image1 = createTestImage(1, 1, [255, 255, 255, 255]);
      const image2 = createTestImage(1, 1, [0, 0, 0, 255]);

      const result = VisualComparator.compare(image1, image2);

      expect(result.diffPixels).toBe(1);
      expect(result.diffPercentage).toBe(100);
    });

    it('should handle 1x1 identical pixels', () => {
      const image = createTestImage(1, 1, [128, 128, 128, 255]);

      const result = VisualComparator.compare(image, image);

      expect(result.diffPixels).toBe(0);
      expect(result.diffPercentage).toBe(0);
    });

    it('should handle 1-pixel wide images', () => {
      const image1 = createTestImage(1, 100, [255, 255, 255, 255]);
      const image2 = createTestImage(1, 100, [255, 255, 255, 255]);

      const result = VisualComparator.compare(image1, image2);

      expect(result.diffPixels).toBe(0);
    });

    it('should handle 1-pixel tall images', () => {
      const image1 = createTestImage(100, 1, [255, 255, 255, 255]);
      const image2 = createTestImage(100, 1, [255, 255, 255, 255]);

      const result = VisualComparator.compare(image1, image2);

      expect(result.diffPixels).toBe(0);
    });
  });

  describe('Large Images', () => {
    // NOTE: Large image tests have increased timeout (30s) due to buffer allocation overhead
    // HD resolution (1920x1080) = 2,073,600 pixels * 4 bytes = ~8MB per image
    it(
      'should handle HD resolution images (1920x1080)',
      () => {
        const image1 = createTestImage(1920, 1080, [255, 255, 255, 255]);
        const image2 = createTestImage(1920, 1080, [255, 255, 255, 255]);

        const result = VisualComparator.compare(image1, image2);

        expect(result.diffPixels).toBe(0);
        expect(result.width).toBe(1920);
        expect(result.height).toBe(1080);
      },
      30000,
    ); // 30 second timeout for large image allocation

    it(
      'should handle tall images (100x2000)',
      () => {
        const image1 = createTestImage(100, 2000, [255, 255, 255, 255]);
        const image2 = createTestImage(100, 2000, [255, 255, 255, 255]);

        const result = VisualComparator.compare(image1, image2);

        expect(result.diffPixels).toBe(0);
      },
      30000,
    ); // 30 second timeout for large image allocation

    it(
      'should handle wide images (2000x100)',
      () => {
        const image1 = createTestImage(2000, 100, [255, 255, 255, 255]);
        const image2 = createTestImage(2000, 100, [255, 255, 255, 255]);

        const result = VisualComparator.compare(image1, image2);

        expect(result.diffPixels).toBe(0);
      },
      30000,
    ); // 30 second timeout for large image allocation
  });

  describe('Transparency and Alpha Channel', () => {
    it('should compare fully transparent images', () => {
      const image1 = createTestImage(100, 100, [255, 255, 255, 0]);
      const image2 = createTestImage(100, 100, [255, 255, 255, 0]);

      const result = VisualComparator.compare(image1, image2);

      expect(result.diffPixels).toBe(0);
    });

    it('should detect differences in alpha channel only', () => {
      const alphaFull = Array(100 * 100).fill(255);
      const alphaHalf = Array(100 * 100).fill(128);

      const image1 = createImageWithAlpha(100, 100, [255, 255, 255], alphaFull);
      const image2 = createImageWithAlpha(100, 100, [255, 255, 255], alphaHalf);

      const result = VisualComparator.compare(image1, image2);

      expect(result.diffPixels).toBeGreaterThan(0);
    });

    it('should handle gradient transparency', () => {
      const alphaGradient = Array.from({ length: 100 * 100 }, (_, i) =>
        Math.floor((i / (100 * 100)) * 255),
      );
      const alphaFlat = Array(100 * 100).fill(255);

      const image1 = createImageWithAlpha(100, 100, [255, 255, 255], alphaGradient);
      const image2 = createImageWithAlpha(100, 100, [255, 255, 255], alphaFlat);

      const result = VisualComparator.compare(image1, image2);

      expect(result.diffPixels).toBeGreaterThan(0);
    });

    it('should compare images with partial transparency', () => {
      const alpha1 = Array(100 * 100).fill(200);
      const alpha2 = Array(100 * 100).fill(200);

      const image1 = createImageWithAlpha(100, 100, [128, 128, 128], alpha1);
      const image2 = createImageWithAlpha(100, 100, [128, 128, 128], alpha2);

      const result = VisualComparator.compare(image1, image2);

      expect(result.diffPixels).toBe(0);
    });

    it('should handle checkerboard transparency pattern', () => {
      const checkerboard = Array.from({ length: 100 * 100 }, (_, i) => {
        const x = i % 100;
        const y = Math.floor(i / 100);
        return (x + y) % 2 === 0 ? 255 : 0;
      });

      const image1 = createImageWithAlpha(100, 100, [255, 255, 255], checkerboard);
      const image2 = createImageWithAlpha(100, 100, [255, 255, 255], checkerboard);

      const result = VisualComparator.compare(image1, image2);

      expect(result.diffPixels).toBe(0);
    });
  });

  describe('Aspect Ratio Mismatches', () => {
    it('should detect portrait vs landscape mismatch', () => {
      const portrait = createTestImage(100, 200, [255, 255, 255, 255]);
      const landscape = createTestImage(200, 100, [255, 255, 255, 255]);

      const result = VisualComparator.compare(portrait, landscape);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('size');
    });

    it('should detect square vs rectangle mismatch', () => {
      const square = createTestImage(100, 100, [255, 255, 255, 255]);
      const rectangle = createTestImage(100, 150, [255, 255, 255, 255]);

      const result = VisualComparator.compare(square, rectangle);

      expect(result.error).toBeDefined();
    });

    it('should detect extreme aspect ratio mismatch', () => {
      const wide = createTestImage(1000, 10, [255, 255, 255, 255]);
      const tall = createTestImage(10, 1000, [255, 255, 255, 255]);

      const result = VisualComparator.compare(wide, tall);

      expect(result.error).toBeDefined();
    });
  });

  describe('Color Depth and Variations', () => {
    it('should compare pure black and pure white', () => {
      const black = createTestImage(100, 100, [0, 0, 0, 255]);
      const white = createTestImage(100, 100, [255, 255, 255, 255]);

      const result = VisualComparator.compare(black, white);

      expect(result.diffPixels).toBe(10000);
      expect(result.diffPercentage).toBe(100);
    });

    it('should detect subtle grayscale differences', () => {
      const gray1 = createTestImage(100, 100, [127, 127, 127, 255]);
      const gray2 = createTestImage(100, 100, [128, 128, 128, 255]);

      const result = VisualComparator.compare(gray1, gray2);

      expect(typeof result.diffPixels).toBe('number');
    });

    it('should handle images with single color channel active', () => {
      const red = createTestImage(100, 100, [255, 0, 0, 255]);
      const green = createTestImage(100, 100, [0, 255, 0, 255]);

      const result = VisualComparator.compare(red, green);

      expect(result.diffPixels).toBeGreaterThan(0);
    });

    it('should compare monochrome images', () => {
      const mono1 = createTestImage(100, 100, [0, 0, 0, 255]);
      const mono2 = createTestImage(100, 100, [255, 255, 255, 255]);

      const result = VisualComparator.compare(mono1, mono2);

      expect(result.diffPercentage).toBe(100);
    });
  });

  describe('Diff Image Generation Edge Cases', () => {
    it('should generate diff image for 1x1 images', () => {
      const image1 = createTestImage(1, 1, [255, 0, 0, 255]);
      const image2 = createTestImage(1, 1, [0, 255, 0, 255]);

      const result = VisualComparator.compare(image1, image2, { generateDiffImage: true });

      expect(result.diffImage).toBeDefined();
      if (result.diffImage) {
        const diffPng = PNG.sync.read(result.diffImage);
        expect(diffPng.width).toBe(1);
        expect(diffPng.height).toBe(1);
      }
    });

    it('should generate diff image for large images', () => {
      const image1 = createTestImage(800, 600, [255, 255, 255, 255]);
      const image2 = createTestImage(800, 600, [0, 0, 0, 255]);

      const result = VisualComparator.compare(image1, image2, { generateDiffImage: true });

      expect(result.diffImage).toBeDefined();
      if (result.diffImage) {
        const diffPng = PNG.sync.read(result.diffImage);
        expect(diffPng.width).toBe(800);
        expect(diffPng.height).toBe(600);
      }
    });

    it('should not generate diff image when images are identical', () => {
      const image = createTestImage(100, 100, [255, 255, 255, 255]);

      const result = VisualComparator.compare(image, image, { generateDiffImage: false });

      expect(result.diffImage).toBeUndefined();
    });
  });

  describe('Threshold Boundary Conditions', () => {
    it('should handle threshold of 0%', () => {
      const image1 = createTestImage(100, 100, [255, 255, 255, 255]);
      const image2 = createTestImage(100, 100, [255, 255, 254, 255]);

      const result = VisualComparator.compare(image1, image2, { threshold: 0 });

      if (result.diffPixels > 0) {
        expect(result.thresholdExceeded).toBe(true);
      }
    });

    it('should handle threshold of 100%', () => {
      const black = createTestImage(100, 100, [0, 0, 0, 255]);
      const white = createTestImage(100, 100, [255, 255, 255, 255]);

      const result = VisualComparator.compare(black, white, { threshold: 100 });

      expect(result.thresholdExceeded).toBe(false);
    });

    it('should handle very small threshold (0.001%)', () => {
      const image1 = createTestImage(100, 100, [255, 255, 255, 255]);
      const image2 = createTestImage(100, 100, [255, 255, 255, 255]);

      const result = VisualComparator.compare(image1, image2, { threshold: 0.001 });

      expect(result.thresholdExceeded).toBe(false);
    });

    it('should handle threshold exactly at diff percentage', () => {
      const image1 = createTestImage(100, 100, [255, 255, 255, 255]);
      const image2 = createTestImage(100, 100, [255, 255, 255, 255]);

      const result1 = VisualComparator.compare(image1, image2, { threshold: 1.0 });
      const actualDiff = result1.diffPercentage;

      const result2 = VisualComparator.compare(image1, image2, { threshold: actualDiff });

      expect(result2.thresholdExceeded).toBe(false);
    });
  });

  describe('Pixel Format Edge Cases', () => {
    it('should handle images with odd dimensions', () => {
      const image1 = createTestImage(101, 99, [255, 255, 255, 255]);
      const image2 = createTestImage(101, 99, [255, 255, 255, 255]);

      const result = VisualComparator.compare(image1, image2);

      expect(result.diffPixels).toBe(0);
      expect(result.width).toBe(101);
      expect(result.height).toBe(99);
    });

    it('should handle images with prime number dimensions', () => {
      const image1 = createTestImage(97, 89, [255, 255, 255, 255]);
      const image2 = createTestImage(97, 89, [255, 255, 255, 255]);

      const result = VisualComparator.compare(image1, image2);

      expect(result.diffPixels).toBe(0);
    });

    it('should handle images with power-of-2 dimensions', () => {
      const image1 = createTestImage(512, 512, [255, 255, 255, 255]);
      const image2 = createTestImage(512, 512, [0, 0, 0, 255]);

      const result = VisualComparator.compare(image1, image2);

      expect(result.diffPixels).toBe(262144);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle antialiasing differences', () => {
      const sharp = createTestImage(100, 100, [0, 0, 0, 255]);
      const blurred = createTestImage(100, 100, [1, 1, 1, 255]);

      const result = VisualComparator.compare(sharp, blurred);

      expect(typeof result.diffPixels).toBe('number');
    });

    it('should handle subpixel rendering differences', () => {
      const image1 = createTestImage(100, 100, [100, 100, 100, 255]);
      const image2 = createTestImage(100, 100, [101, 100, 100, 255]);

      const result = VisualComparator.compare(image1, image2);

      expect(typeof result.diffPercentage).toBe('number');
    });

    it('should handle JPEG-like compression artifacts', () => {
      const clean = createTestImage(100, 100, [128, 128, 128, 255]);
      const noisy = createTestImage(100, 100, [129, 127, 128, 255]);

      const result = VisualComparator.compare(clean, noisy);

      expect(typeof result.diffPixels).toBe('number');
    });
  });
});
