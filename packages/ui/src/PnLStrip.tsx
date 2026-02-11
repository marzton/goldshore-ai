import React from "react";
import "./PnLStrip.css";

interface PnLStripProps {
  realized: number;
  unrealized: number;
  dayChange: number;
  currency?: string;
}

function format(v: number, currency: string) {
  const sign = v >= 0 ? "+" : "-";
  const abs = Math.abs(v).toFixed(2);
  return `${sign}${currency}${abs}`;
}

export const PnLStrip: React.FC<PnLStripProps> = ({
  realized,
  unrealized,
  dayChange,
  currency = "$",
}) => {
  const total = realized + unrealized;
  const status = total >= 0 ? "pos" : "neg";
  return (
    <div className={`gs-pnl-strip gs-pnl-${status}`}>
      <div className="gs-pnl-item">
        <div className="gs-pnl-label">Realized</div>
        <div className="gs-pnl-value">{format(realized, currency)}</div>
      </div>
      <div className="gs-pnl-item">
        <div className="gs-pnl-label">Unrealized</div>
        <div className="gs-pnl-value">{format(unrealized, currency)}</div>
      </div>
      <div className="gs-pnl-item gs-pnl-total">
        <div className="gs-pnl-label">Total P&L</div>
        <div className="gs-pnl-value">{format(total, currency)}</div>
        <div className="gs-pnl-change">
          Day: {format(dayChange, currency)}
        </div>
      </div>
    </div>
  );
};
