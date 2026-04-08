import React, { useEffect, useRef, useState } from "react";
import "../editorWidgets/MutableNumberField.css"
import { clamp } from "../math/utils";

export type MutableNumberFieldProps = {
  className?: string;
  value: number;
  maxValue?: number;
  minValue?: number;
  canIncrease: boolean;
  canDecrease: boolean;
  onStep: (delta: number) => void;
  onAcceptedChange: (value: number) => void;
  step: number;
  inputId: string;
};

export function MutableNumberField(props: MutableNumberFieldProps) {
  const valueChangeIntervalRef = useRef<number | null>(null);
  const intervalLength = 20;

  const [draft, setDraft] = useState<string>(String(props.value));

  useEffect(() => {
    setDraft(props.value.toFixed(1));
  }, [props.value]);

  function handleBlur() {
    const parsed = Number(draft);
    const fallback =
      props.minValue !== undefined ? props.minValue : props.value;

    const newVal = clamp({
      value: Number.isNaN(parsed) ? fallback : parsed,
      min: props.minValue,
      max: props.maxValue,
    });

    props.onAcceptedChange(newVal);
  }

  function applyStep(increase: boolean) {
    const delta = increase ? props.step : -props.step;
    props.onStep(delta);
  }

  function handleStartInterval(
    e: React.PointerEvent<HTMLButtonElement>,
    increase: boolean
  ) {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (valueChangeIntervalRef.current !== null) return;

    applyStep(increase);

    valueChangeIntervalRef.current = window.setInterval(() => {
      applyStep(increase);
    }, intervalLength);
  }

  function handleStopInterval() {
    if (valueChangeIntervalRef.current !== null) {
      clearInterval(valueChangeIntervalRef.current);
      valueChangeIntervalRef.current = null;
    }
  }

  return (
    <div className={`MutableNumberField ${props.className ?? ""}`}>
      <button
        type="button"
        disabled={!props.canDecrease}
        onPointerDown={(e) => handleStartInterval(e, false)}
        onPointerUp={handleStopInterval}
        onPointerCancel={handleStopInterval}
        className="MutableNumberFieldDecreaseButton MutableNumberFieldButton"
      >
        -
      </button>

      <input
        type="number"
        className="MutableNumberFieldValue"
        value={draft}
        step={props.step}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        id={props.inputId}
      />

      <button
        type="button"
        disabled={!props.canIncrease}
        onPointerDown={(e) => handleStartInterval(e, true)}
        onPointerUp={handleStopInterval}
        onPointerCancel={handleStopInterval}
        className="MutableNumberFieldIncreaseButton MutableNumberFieldButton"
      >
        +
      </button>
    </div>
  );
}