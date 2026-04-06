
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendChatMessage } from '../../src/services/chat-stream';

// Vite 환경 변수 모킹
vi.mock('import.meta.env', () => ({
    VITE_BACKEND_URL: 'http://localhost:8000',
    VITE_LLM_PROVIDER: 'vllm',
    VITE_LLM_MODEL: 'test-model',
    VITE_LLM_TEMPERATURE: '0.5',
    VITE_LLM_MAX_TOKENS: '128'
}));

// TextDecoder 폴리필
import { TextDecoder, TextEncoder } from 'util';
vi.stubGlobal('TextDecoder', TextDecoder);
vi.stubGlobal('TextEncoder', TextEncoder);

describe('Chat Stream Service', () => {
    const BACKEND_URL = 'http://localhost:8000';

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    // Mock ReadableStream 생성 헬퍼
    function createMockStream(chunks) {
        const stream = new ReadableStream({
            start(controller) {
                chunks.forEach(chunk => {
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(chunk));
                });
                controller.close();
            }
        });
        return stream;
    }

    // 지연된 청크 전송을 위한 Mock Stream
    function createDelayedMockStream(chunks, delay = 10) {
        return new ReadableStream({
            async start(controller) {
                for (const chunk of chunks) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(chunk));
                }
                controller.close();
            }
        });
    }

    describe('sendChatMessage', () => {
        it('성공적인 스트림 응답을 파싱하여 onChunk와 onDone을 호출해야 한다', async () => {
            const messages = [{ role: 'user', content: 'hello' }];
            const accessToken = 'test-token';
            const onChunk = vi.fn();
            const onDone = vi.fn();
            const onError = vi.fn();

            const mockResponseChunks = [
                '{"type": "data", "content": "Hello"}\n',
                '{"type": "data", "content": " world"}\n',
                '{"type": "end"}\n'
            ];

            fetch.mockResolvedValue({
                ok: true,
                body: createMockStream(mockResponseChunks)
            });

            await new Promise(resolve => {
                sendChatMessage({
                    messages,
                    accessToken,
                    onChunk,
                    onDone: () => {
                        onDone();
                        resolve();
                    },
                    onError
                });
            });

            expect(onChunk).toHaveBeenCalledTimes(3);
            expect(onChunk).toHaveBeenNthCalledWith(1, {
                type: 'data',
                content: 'Hello',
                category: '',
                status: '',
                metadata: {}
            });
            expect(onChunk).toHaveBeenNthCalledWith(2, {
                type: 'data',
                content: ' world',
                category: '',
                status: '',
                metadata: {}
            });
            expect(onChunk).toHaveBeenNthCalledWith(3, {
                type: 'end',
                content: '',
                category: '',
                status: '',
                metadata: {}
            });
            expect(onDone).toHaveBeenCalledTimes(1);
            expect(onError).not.toHaveBeenCalled();
        });

        it('쪼개진 데이터 청크를 올바르게 버퍼링하여 파싱해야 한다', async () => {
            const messages = [{ role: 'user', content: 'hello' }];
            const onChunk = vi.fn();
            const onDone = vi.fn();

            // "{"type": "data", "content": "Split"}" 데이터가 두 번에 걸쳐 들어오는 상황
            const mockResponseChunks = [
                '{"type": "data", "con',
                'tent": "Split"}\n',
                '{"type": "end"}\n'
            ];

            fetch.mockResolvedValue({
                ok: true,
                body: createDelayedMockStream(mockResponseChunks, 5) // 약간의 지연 추가
            });

            await new Promise(resolve => {
                sendChatMessage({
                    messages,
                    accessToken: 'token',
                    onChunk,
                    onDone: () => {
                        onDone();
                        resolve();
                    }
                });
            });

            expect(onChunk).toHaveBeenCalledWith({
                type: 'data',
                content: 'Split',
                category: '',
                status: '',
                metadata: {}
            });
            expect(onDone).toHaveBeenCalled();
        });

        it('message content 배열에서는 렌더링 가능한 텍스트만 추출해야 한다', async () => {
            const onChunk = vi.fn();
            const onDone = vi.fn();

            const mockResponseChunks = [
                'data: {"type":"data","category":"message","status":"end","content":[{"id":"rs_1","type":"reasoning","summary":[],"index":0},{"type":"function_call","name":"knowledge","arguments":"{}","call_id":"call_1","id":"fc_1","index":1}],"metadata":{"node":"model"}}\n',
                'data: {"type":"data","category":"message","status":"ing","content":"좋은","metadata":{"node":"model"}}\n',
                'data: {"type":"end"}\n'
            ];

            fetch.mockResolvedValue({
                ok: true,
                body: createMockStream(mockResponseChunks)
            });

            await new Promise(resolve => {
                sendChatMessage({
                    messages: [{ role: 'user', content: 'hello' }],
                    accessToken: 'token',
                    onChunk,
                    onDone: () => {
                        onDone();
                        resolve();
                    }
                });
            });

            expect(onChunk).toHaveBeenNthCalledWith(1, {
                type: 'data',
                category: 'message',
                status: 'end',
                content: '',
                metadata: { node: 'model' }
            });
            expect(onChunk).toHaveBeenNthCalledWith(2, {
                type: 'data',
                category: 'message',
                status: 'ing',
                content: '좋은',
                metadata: { node: 'model' }
            });
            expect(onDone).toHaveBeenCalled();
        });

        it('인증 헤더와 요청 바디가 올바르게 전송되어야 한다', async () => {
            fetch.mockResolvedValue({
                ok: true,
                body: createMockStream(['{"type": "end"}\n'])
            });

            const messages = [{ role: 'user', content: 'hi' }];
            sendChatMessage({ messages, accessToken: 'my-token' });

            expect(fetch).toHaveBeenCalledTimes(1);

            const [url, options] = fetch.mock.calls[0];
            expect(url).toContain('/api/v1/agent/chat');
            expect(options.method).toBe('POST');
            expect(options.headers).toMatchObject({
                'Content-Type': 'application/json',
                'authorization': 'Bearer my-token'
            });
            expect(options.body).toEqual(expect.any(String));

            // Body 내용을 별도로 파싱하여 검증
            const requestBody = JSON.parse(options.body);
            expect(requestBody).toHaveProperty('user_id');
            expect(requestBody).toHaveProperty('session_id');
            expect(requestBody).toHaveProperty('message');
            expect(requestBody).toHaveProperty('google_calendar_token');
        });

        it('백엔드 응답이 실패(ok=false)인 경우 에러를 발생시켜야 한다', async () => {
            const onError = vi.fn();
            fetch.mockResolvedValue({
                ok: false,
                text: async () => 'Internal Server Error'
            });

            await new Promise(resolve => {
                sendChatMessage({
                    messages: [],
                    accessToken: '',
                    onError: (err) => {
                        onError(err);
                        resolve();
                    }
                });
            });

            expect(onError).toHaveBeenCalledWith(expect.any(Error));
            expect(onError.mock.calls[0][0].message).toBe('Internal Server Error');
        });

        it('네트워크 에러 발생 시 onError가 호출되어야 한다', async () => {
            const onError = vi.fn();
            fetch.mockRejectedValue(new Error('Network fail'));

            await new Promise(resolve => {
                sendChatMessage({
                    messages: [],
                    accessToken: '',
                    onError: (err) => {
                        onError(err);
                        resolve();
                    }
                });
            });

            expect(onError).toHaveBeenCalledWith(expect.any(Error));
        });

        it('AbortController를 통해 요청을 취소할 수 있어야 한다', async () => {
            const abortController = new AbortController();
            const onError = vi.fn();

            // 지연된 응답으로 설정하여 취소할 시간을 범
            fetch.mockImplementation(() => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (abortController.signal.aborted) {
                            reject(new DOMException('Aborted', 'AbortError'));
                        } else {
                            resolve({ ok: true, body: createMockStream([]) });
                        }
                    }, 100);
                });
            });

            const cancel = sendChatMessage({
                messages: [],
                accessToken: '',
                onError
            });

            // 즉시 취소
            cancel();

            // fetch가 취소 신호를 받았는지 확인 (fetch 호출 시 signal이 전달되었는지)
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    signal: expect.any(AbortSignal)
                })
            );
        });
    });
});
