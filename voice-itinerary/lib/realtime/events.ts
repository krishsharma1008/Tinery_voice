/**
 * Minimal typed shapes for the OpenAI Realtime data-channel protocol.
 * Only fields we actually consume are typed; unknown fields are passed through.
 *
 * Per PLAN §14.1 (Codex correction): execute tool calls from `response.done`,
 * not from the `function_call_arguments.delta/.done` stream — `response.done`
 * carries the complete function call. Deltas are buffered for UI debug only.
 */

export type RealtimeServerEvent =
  | { type: "session.created"; session: unknown }
  | { type: "session.updated"; session: unknown }
  | { type: "input_audio_buffer.speech_started" }
  | { type: "input_audio_buffer.speech_stopped" }
  | {
      type: "conversation.item.input_audio_transcription.completed";
      item_id: string;
      transcript: string;
    }
  | { type: "response.created"; response: { id: string } }
  | {
      type: "response.audio_transcript.delta";
      response_id: string;
      delta: string;
    }
  | {
      type: "response.audio_transcript.done";
      response_id: string;
      transcript: string;
    }
  | {
      type: "response.done";
      response: {
        id: string;
        output: Array<
          | {
              type: "function_call";
              call_id: string;
              name: string;
              arguments: string; // JSON-encoded
            }
          | { type: "message"; role: "assistant"; content: unknown }
          | { type: string; [k: string]: unknown }
        >;
      };
    }
  | { type: "error"; error: { type?: string; message?: string } }
  | { type: string; [k: string]: unknown };

export type RealtimeClientEvent =
  | {
      type: "session.update";
      session: Record<string, unknown>;
    }
  | {
      type: "conversation.item.create";
      item: {
        type: "function_call_output" | "message";
        call_id?: string;
        output?: string;
        role?: "user" | "assistant" | "system";
        content?: Array<{ type: "input_text" | "input_audio"; text?: string }>;
      };
    }
  | { type: "response.create"; response?: Record<string, unknown> }
  | { type: "response.cancel" }
  | { type: "input_audio_buffer.commit" };

export type FunctionCall = {
  call_id: string;
  name: string;
  arguments: string; // JSON-encoded
};

/**
 * Build a `conversation.item.create` item that replays a finalized transcript
 * turn during reconnect. Used by RealtimeClient.replayContext() to seed the
 * post-reconnect session with recent context (PLAN §5.2).
 */
export function messageItemFromTurn(
  role: "user" | "assistant",
  text: string,
): NonNullable<Extract<RealtimeClientEvent, { type: "conversation.item.create" }>["item"]> {
  return {
    type: "message",
    role,
    content: [{ type: "input_text", text }],
  };
}
