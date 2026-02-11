import React from "react";
import "./ActivityTimeline.css";

export interface ActivityItem {
  ts: string;
  label: string;
  detail?: string;
  level?: "info" | "warn" | "error";
}

interface Props {
  items: ActivityItem[];
}

export const ActivityTimeline: React.FC<Props> = ({ items }) => {
  return (
    <div className="gs-timeline">
      {items.map((a, idx) => (
        <div key={idx} className={`gs-timeline-item gs-timeline-${a.level || "info"}`}>
          <div className="gs-timeline-dot" />
          <div className="gs-timeline-body">
            <div className="gs-timeline-header">
              <span className="gs-timeline-label">{a.label}</span>
              <span className="gs-timeline-ts">{a.ts}</span>
            </div>
            {a.detail && <div className="gs-timeline-detail">{a.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};
