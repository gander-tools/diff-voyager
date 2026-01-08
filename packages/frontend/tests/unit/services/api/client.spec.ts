import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiError, get, post, RateLimitError } from '@/services/api/client';

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Setup MSW server
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Client', () => {
  describe('Error Handling', () => {
    it('should throw ApiError for 404 responses', async () => {
      server.use(
        http.get(`${API_BASE_URL}/not-found`, () => {
          return HttpResponse.json({ error: 'Resource not found' }, { status: 404 });
        }),
      );

      await expect(get('/not-found')).rejects.toThrow(ApiError);
      await expect(get('/not-found')).rejects.toThrow('Resource not found');
    });

    it('should throw ApiError for 500 responses', async () => {
      server.use(
        http.get(`${API_BASE_URL}/server-error`, () => {
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        }),
      );

      await expect(get('/server-error')).rejects.toThrow(ApiError);
      await expect(get('/server-error')).rejects.toThrow('Internal server error');
    });

    it('should handle non-JSON error responses', async () => {
      server.use(
        http.get(`${API_BASE_URL}/text-error`, () => {
          return new HttpResponse('Bad Request', { status: 400 });
        }),
      );

      await expect(get('/text-error')).rejects.toThrow(ApiError);
    });

    it('should include status code in ApiError', async () => {
      server.use(
        http.get(`${API_BASE_URL}/bad-request`, () => {
          return HttpResponse.json({ error: 'Invalid request' }, { status: 400 });
        }),
      );

      try {
        await get('/bad-request');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(400);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should throw RateLimitError for 429 responses', async () => {
      server.use(
        http.get(`${API_BASE_URL}/rate-limited`, () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            {
              status: 429,
              headers: { 'Retry-After': '2' },
            },
          );
        }),
      );

      // Use fetchWithRetry with maxRetries=0 to avoid retries
      const { fetchWithRetry } = await import('@/services/api/client');
      await expect(fetchWithRetry('/rate-limited', {}, 0)).rejects.toThrow(RateLimitError);
    });

    it('should extract Retry-After header from 429 responses', async () => {
      server.use(
        http.get(`${API_BASE_URL}/rate-limited-with-retry`, () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            {
              status: 429,
              headers: { 'Retry-After': '5' },
            },
          );
        }),
      );

      const { fetchWithRetry } = await import('@/services/api/client');
      try {
        await fetchWithRetry('/rate-limited-with-retry', {}, 0);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(5000); // 5 seconds in ms
      }
    });

    it('should retry on rate limit errors', async () => {
      let attempts = 0;

      server.use(
        http.get(`${API_BASE_URL}/retry-success`, () => {
          attempts++;

          // Fail first 2 attempts, succeed on 3rd
          if (attempts < 3) {
            return HttpResponse.json(
              { error: 'Rate limit exceeded' },
              {
                status: 429,
                headers: { 'Retry-After': '0.1' }, // Short retry for testing
              },
            );
          }

          return HttpResponse.json({ success: true });
        }),
      );

      const result = await get<{ success: boolean }>('/retry-success');
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    }, 10000); // Increase timeout for retries

    it('should fail after max retries', async () => {
      let attempts = 0;

      server.use(
        http.get(`${API_BASE_URL}/always-rate-limited`, () => {
          attempts++;
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            {
              status: 429,
              headers: { 'Retry-After': '0.1' },
            },
          );
        }),
      );

      await expect(get('/always-rate-limited')).rejects.toThrow(RateLimitError);
      // Should try: 1 initial + 3 retries = 4 total
      expect(attempts).toBe(4);
    }, 10000);
  });

  describe('Successful Requests', () => {
    it('should handle GET requests', async () => {
      server.use(
        http.get(`${API_BASE_URL}/test`, () => {
          return HttpResponse.json({ data: 'test' });
        }),
      );

      const result = await get<{ data: string }>('/test');
      expect(result.data).toBe('test');
    });

    it('should handle POST requests with body', async () => {
      server.use(
        http.post(`${API_BASE_URL}/test`, async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({ received: body });
        }),
      );

      const result = await post<{ received: { name: string } }>('/test', { name: 'test' });
      expect(result.received.name).toBe('test');
    });

    it('should include Content-Type header', async () => {
      let headers: Headers | undefined;

      server.use(
        http.get(`${API_BASE_URL}/test-headers`, ({ request }) => {
          headers = request.headers;
          return HttpResponse.json({ success: true });
        }),
      );

      await get('/test-headers');
      expect(headers?.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Request Types', () => {
    it('should support typed responses', async () => {
      interface TestResponse {
        id: number;
        name: string;
      }

      server.use(
        http.get(`${API_BASE_URL}/typed`, () => {
          return HttpResponse.json({ id: 1, name: 'test' });
        }),
      );

      const result = await get<TestResponse>('/typed');
      expect(result.id).toBe(1);
      expect(result.name).toBe('test');
    });
  });
});
