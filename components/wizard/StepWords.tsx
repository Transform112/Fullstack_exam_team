"use client";

// Step 3 - Words and language (docs/03 P2-04): the language of the page, one to five
// messages and up to eight memories. No AI button: LANG-2 is a later bonus step.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWizardData, FieldError } from "./Wizard";
import type { WizardData } from "@/lib/wizard";

const MAX_MESSAGES = 5;
const MAX_MEMORIES = 8;
const MAX_MESSAGE_LENGTH = 600;

const LANGUAGE_OPTIONS: Array<{ value: WizardData["language"]; title: string; sample: string }> = [
  {
    value: "HINGLISH",
    title: "Hinglish",
    sample: "Tu best hai yaar, har din tere bina boring hai",
  },
  {
    value: "ENGLISH",
    title: "English",
    sample: "You are the best, every day without you is boring",
  },
  {
    value: "HINDI",
    title: "Hindi",
    sample:
      "\u0924\u0941\u092e \u0938\u092c\u0938\u0947 \u0905\u091a\u094d\u091b\u0947 \u0939\u094b",
  },
];

export function StepWords() {
  const { data, setData, errors, registerField } = useWizardData();
  const reduced = !!useReducedMotion();

  const setMessage = (index: number, value: string) => {
    setData((current) => {
      const messages = current.messages.map((message, i) => (i === index ? value : message));
      return { ...current, messages };
    });
  };

  const addMessage = () =>
    setData((current) =>
      current.messages.length >= MAX_MESSAGES
        ? current
        : { ...current, messages: [...current.messages, ""] },
    );

  const removeMessage = (index: number) =>
    setData((current) => ({
      ...current,
      messages: current.messages.filter((_, i) => i !== index),
    }));

  const setMemory = (index: number, patch: Partial<WizardData["memories"][number]>) =>
    setData((current) => ({
      ...current,
      memories: current.memories.map((memory, i) =>
        i === index ? { ...memory, ...patch } : memory,
      ),
    }));

  const addMemory = () =>
    setData((current) =>
      current.memories.length >= MAX_MEMORIES
        ? current
        : {
            ...current,
            memories: [...current.memories, { title: "", date: "", description: "", mediaId: "" }],
          },
    );

  const removeMemory = (index: number) =>
    setData((current) => ({
      ...current,
      memories: current.memories.filter((_, i) => i !== index),
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-normal tracking-tight text-ink sm:text-3xl">The words</h2>
        <p className="mt-1 text-sm text-muted">
          Choose the language of the page, then write what you want to say.
        </p>
      </div>

      <div role="radiogroup" aria-label="Language" className="grid gap-3 sm:grid-cols-3">
        {LANGUAGE_OPTIONS.map((option, index) => {
          const active = data.language === option.value;
          return (
            <motion.button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              ref={index === 0 ? registerField("language") : undefined}
              onClick={() => setData((current) => ({ ...current, language: option.value }))}
              whileTap={{ scale: 0.97 }}
              animate={{ scale: active && !reduced ? 1.03 : 1 }}
              transition={
                reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 16 }
              }
              className={[
                "flex min-h-[112px] flex-col items-start gap-2 rounded-card border p-4 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "border-border bg-white hover:bg-canvas",
              ].join(" ")}
            >
              <span className="font-heading text-base font-semibold text-ink">{option.title}</span>
              <span className="text-xs leading-relaxed text-muted">{option.sample}</span>
            </motion.button>
          );
        })}
      </div>
      <FieldError message={errors.language} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Your message</Label>
          <span className="text-xs text-muted">
            {data.messages.length}/{MAX_MESSAGES}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {data.messages.map((message, index) => (
            <motion.div
              key={index}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              <Textarea
                id={index === 0 ? "messages.0" : undefined}
                ref={index === 0 ? registerField("messages.0") : undefined}
                aria-label={`Message ${index + 1}`}
                value={message}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder={index === 0 ? "Write from the heart..." : "One more thing..."}
                onChange={(event) => setMessage(index, event.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </span>
                {data.messages.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMessage(index)}
                    aria-label={`Remove message ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Remove
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {data.messages.length < MAX_MESSAGES && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMessage}
            className="self-start"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add another message
          </Button>
        )}
        <FieldError message={errors.messages} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Memories (optional)</Label>
          <span className="text-xs text-muted">
            {data.memories.length}/{MAX_MEMORIES}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {data.memories.map((memory, index) => (
            <motion.div
              key={memory.id ?? `memory-${index}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 rounded-card border border-border bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Memory {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMemory(index)}
                  aria-label={`Remove memory ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Remove
                </Button>
              </div>
              <Input
                id={index === 0 ? "memories.0.title" : undefined}
                ref={index === 0 ? registerField("memories.0.title") : undefined}
                aria-label={`Memory ${index + 1} title`}
                value={memory.title}
                maxLength={60}
                placeholder="First day of college"
                onChange={(event) => setMemory(index, { title: event.target.value })}
              />
              <Input
                type="date"
                aria-label={`Memory ${index + 1} date`}
                value={memory.date ?? ""}
                onChange={(event) => setMemory(index, { date: event.target.value })}
                className="max-w-xs"
              />
              <Textarea
                aria-label={`Memory ${index + 1} description`}
                value={memory.description ?? ""}
                maxLength={300}
                placeholder="What made it special?"
                onChange={(event) => setMemory(index, { description: event.target.value })}
              />
              <span className="self-end text-xs text-muted">
                {(memory.description ?? "").length}/300
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {data.memories.length < MAX_MEMORIES && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMemory}
            className="self-start"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add a memory
          </Button>
        )}
        <p className="text-xs text-muted">You can link photos to memories in the Media step</p>
        <FieldError message={errors.memories} />
      </div>
    </div>
  );
}

export default StepWords;
