import { useCountUp } from "@/hooks/useCountUp";
import { formatNumber } from "@/lib/format";

interface CountUpProps {
  value: number;
  className?: string;
  /** Appended after the number, e.g. "%" */
  suffix?: string;
}

/** A number that counts up once when it first becomes visible. */
const CountUp = ({ value, className, suffix }: CountUpProps) => {
  const { ref, value: current } = useCountUp<HTMLSpanElement>(value);
  return (
    <span ref={ref} className={className}>
      {formatNumber(current)}
      {suffix}
    </span>
  );
};

export default CountUp;
