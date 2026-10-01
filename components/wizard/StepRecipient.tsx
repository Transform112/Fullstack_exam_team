"use client";

// Step 2 - Recipient (docs/03 P2-03): who the page is for and who it is from.
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWizardData, FieldError } from "./Wizard";

const RELATION_CHIPS = ["Best friend", "Partner", "Sibling", "Parent", "Colleague", "Child"];

export function StepRecipient() {
  const { data, setData, errors, registerField } = useWizardData();
  const reduced = !!useReducedMotion();
  // Keeps a chip highlighted while the field holds exactly its value.
  const chipRef = useRef<string | null>(null);

  // Recipient fields live in one nested object, so patches merge into it.
  const setRecipient = (patch: Partial<typeof data.recipient>) => {
    setData((current) => ({ ...current, recipient: { ...current.recipient, ...patch } }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-normal tracking-tight text-ink sm:text-3xl">Who is this for?</h2>
        <p className="mt-1 text-sm text-muted">Their name leads the greeting on the page.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="recipientName">Their name</Label>
        <Input
          id="recipientName"
          ref={registerField("recipient.name")}
          value={data.recipient.name}
          maxLength={40}
          placeholder="Riya"
          autoComplete="off"
          onChange={(event) => setRecipient({ name: event.target.value })}
        />
        <span className="self-end text-xs text-muted">{data.recipient.name.length}/40</span>
        <FieldError message={errors["recipient.name"]} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="recipientNickname">Nickname (optional)</Label>
        <Input
          id="recipientNickname"
          ref={registerField("recipient.nickname")}
          value={data.recipient.nickname}
          maxLength={40}
          placeholder="Riyu"
          autoComplete="off"
          onChange={(event) => setRecipient({ nickname: event.target.value })}
        />
        <FieldError message={errors["recipient.nickname"]} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="recipientRelation">Relation (optional)</Label>
        <Input
          id="recipientRelation"
          ref={registerField("recipient.relation")}
          value={data.recipient.relation}
          maxLength={40}
          placeholder="Best friend"
          autoComplete="off"
          onChange={(event) => {
            setRecipient({ relation: event.target.value });
            if (chipRef.current && event.target.value !== chipRef.current) chipRef.current = null;
          }}
        />
        <div className="flex flex-wrap gap-2">
          {RELATION_CHIPS.map((chip) => {
            const active = data.recipient.relation === chip;
            return (
              <motion.button
                key={chip}
                type="button"
                whileTap={{ scale: 0.97 }}
                animate={{ scale: active && !reduced ? 1.03 : 1 }}
                onClick={() => {
                  chipRef.current = chip;
                  setRecipient({ relation: chip });
                }}
                className={[
                  "flex min-h-11 items-center rounded-full border px-3 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-ink ring-2 ring-primary"
                    : "border-border bg-white text-ink hover:bg-canvas",
                ].join(" ")}
              >
                {chip}
              </motion.button>
            );
          })}
        </div>
        <FieldError message={errors["recipient.relation"]} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="recipientAge">Age (optional)</Label>
        <Input
          id="recipientAge"
          type="number"
          inputMode="numeric"
          min={1}
          max={120}
          ref={registerField("recipient.age")}
          value={typeof data.recipient.age === "number" ? String(data.recipient.age) : ""}
          placeholder="24"
          onChange={(event) => {
            const raw = event.target.value;
            setRecipient({ age: raw === "" ? undefined : Number(raw) });
          }}
          className="max-w-[8rem]"
        />
        <FieldError message={errors["recipient.age"]} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="from">From</Label>
        <Input
          id="from"
          ref={registerField("from")}
          value={data.from}
          maxLength={60}
          placeholder="Arjun and the gang"
          autoComplete="off"
          onChange={(event) => setData((current) => ({ ...current, from: event.target.value }))}
        />
        <span className="self-end text-xs text-muted">{data.from.length}/60</span>
        <FieldError message={errors.from} />
      </div>
    </div>
  );
}

export default StepRecipient;
