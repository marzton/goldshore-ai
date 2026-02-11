import React from "react";
import "./MetricStrip.css";

interface MetricItem {
  label: string;
  value: string | number;
  hint?: string;
}

interface Props {
  items: MetricItem[];
}

export const MetricStrip: React.FC<Props> = ({ items }) => {
  return (
    <div className="gs-metric-strip">
      {items.map((m, idx) => (
        <div key={idx} className="gs-metric-strip-item">
          <div className="gs-metric-strip-label">{m.label}</div>
          <div className="gs-metric-strip-value">{m.value}</div>
          {m.hint && <div className="gs-metric-strip-hint">{m.hint}</div>}
        </div>
      ))}
    </div>
  );
};
