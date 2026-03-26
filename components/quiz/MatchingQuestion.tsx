"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState, useEffect } from "react";
import type { MatchingQuestion as MatchingQuestionType } from "@/app/api/quiz/questions/route";

// ─── Draggable Kanji chip ───────────────────────────────────────────────────

function DraggableKanji({
  kanji,
  isPlaced,
}: {
  kanji: string;
  isPlaced: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: kanji,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={[
        "drag-item",
        isDragging ? "drag-item--dragging" : "",
        isPlaced ? "drag-item--placed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: "72px",
        height: "72px",
        fontSize: "clamp(1.6rem, 6vw, 2.2rem)",
        fontWeight: 700,
        color: "#2C2F24",
      }}
      aria-label={`Drag kanji ${kanji}`}
    >
      {kanji}
    </div>
  );
}

// ─── Droppable Meaning slot ─────────────────────────────────────────────────

function DroppableMeaning({
  meaning,
  isCorrect,
  filledWith,
}: {
  meaning: string;
  isCorrect: boolean;
  filledWith: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: meaning });

  const classes = [
    "drop-zone",
    isOver ? "drop-zone--active" : "",
    isCorrect ? "drop-zone--correct" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={setNodeRef}
      className={classes}
      style={{ padding: "0.5rem 1rem", width: "100%" }}
      aria-label={`Drop zone for ${meaning}`}
    >
      {filledWith ? (
        <span
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: isCorrect ? "#5a6b1e" : "#2C2F24",
          }}
        >
          {filledWith}
        </span>
      ) : (
        <span
          style={{
            fontSize: "0.8rem",
            color: "#8A9A41",
            fontStyle: "italic",
          }}
        >
          {meaning}
        </span>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

interface Props {
  question: MatchingQuestionType;
  onComplete: (correct: boolean) => void;
}

export default function MatchingQuestion({ question, onComplete }: Props) {
  const { pairs } = question;

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.disableVerticalSwipes) {
      (window as any).Telegram.WebApp.disableVerticalSwipes();
    }
  }, []);

  const [placements, setPlacements] = useState<Record<string, string | null>>(
    () => Object.fromEntries(pairs.map((p) => [p.meaning, null]))
  );
  const [correctSet, setCorrectSet] = useState<Set<string>>(new Set());
  const [activeKanji, setActiveKanji] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const placedKanjis = new Set(
    Object.values(placements).filter((v): v is string => v !== null)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveKanji(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveKanji(null);
    const { active, over } = event;
    if (!over) return;

    const draggedKanji = active.id as string;
    const targetMeaning = over.id as string;

    const correctPair = pairs.find((p) => p.kanji === draggedKanji);
    const isCorrect = correctPair?.meaning === targetMeaning;

    if (!isCorrect) return;

    setPlacements((prev) => ({ ...prev, [targetMeaning]: draggedKanji }));
    setCorrectSet((prev) => {
      const next = new Set(prev);
      next.add(targetMeaning);
      if (next.size === pairs.length && !completed) {
        setCompleted(true);
        setTimeout(() => onComplete(true), 900);
      }
      return next;
    });
  }

  const kanjis = pairs.map((p) => p.kanji);
  const meanings = pairs.map((p) => p.meaning);

  return (
    <div style={{ width: "100%" }}>
      <p
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#8A9A41",
          textAlign: "center",
          marginBottom: "1.5rem",
        }}
      >
        {question.instruction}
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem 1.25rem",
            alignItems: "center",
          }}
        >
          {/* Left: Kanji chips */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            {kanjis.map((kanji) => (
              <DraggableKanji
                key={kanji}
                kanji={kanji}
                isPlaced={placedKanjis.has(kanji)}
              />
            ))}
          </div>

          {/* Right: Meaning drop-zones */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {meanings.map((meaning) => (
              <DroppableMeaning
                key={meaning}
                meaning={meaning}
                isCorrect={correctSet.has(meaning)}
                filledWith={placements[meaning]}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeKanji ? (
            <div
              className="drag-item"
              style={{
                width: "72px",
                height: "72px",
                fontSize: "clamp(1.6rem,6vw,2.2rem)",
                fontWeight: 700,
                color: "#2C2F24",
                opacity: 0.9,
                cursor: "grabbing",
              }}
            >
              {activeKanji}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {completed && (
        <p
          style={{
            textAlign: "center",
            marginTop: "1.25rem",
            color: "#5a6b1e",
            fontWeight: 600,
            fontSize: "0.9rem",
            letterSpacing: "0.08em",
          }}
        >
          ✓ All matched!
        </p>
      )}
    </div>
  );
}
