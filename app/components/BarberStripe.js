"use client";
import { COLORS } from "../../lib/theme";

export default function BarberStripe({ height = 8 }) {
  return (
    <div style={{
      height, width: "100%",
      background: `repeating-linear-gradient(45deg, ${COLORS.dark} 0 10px, ${COLORS.stripeLight} 10px 20px, ${COLORS.mid} 20px 30px)`,
    }} />
  );
}
