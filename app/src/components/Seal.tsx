import { useMemo } from "react"
import { sealFor } from "../lib/identicon"

/** A wax-seal style identicon derived from a Stellar address. */
export const Seal = ({
	address,
	size = 44,
}: {
	address: string
	size?: number
}) => {
	const seal = useMemo(() => sealFor(address), [address])
	const id = `seal-${address.slice(-8)}`
	return (
		<svg
			className="seal"
			width={size}
			height={size}
			viewBox="0 0 44 44"
			aria-hidden="true"
		>
			<defs>
				<linearGradient
					id={id}
					gradientTransform={`rotate(${seal.angle} .5 .5)`}
				>
					<stop offset="0" stopColor={`hsl(${seal.hueA} 70% 52%)`} />
					<stop offset="1" stopColor={`hsl(${seal.hueB} 75% 38%)`} />
				</linearGradient>
			</defs>
			<path
				d="M22 1.5l4.1 3 5-.6 2.3 4.5 4.6 2.1-.5 5 3 4.1-3 4.1.5 5-4.6 2.1-2.3 4.5-5-.6-4.1 3-4.1-3-5 .6-2.3-4.5-4.6-2.1.5-5-3-4.1 3-4.1-.5-5 4.6-2.1 2.3-4.5 5 .6z"
				fill={`url(#${id})`}
			/>
			<circle
				cx="22"
				cy="22"
				r="13.5"
				fill="none"
				stroke="rgba(255,255,255,.35)"
				strokeWidth="1"
			/>
			{seal.cells.map((on, i) =>
				on ? (
					<rect
						key={i}
						x={14.5 + (i % 5) * 3}
						y={14.5 + Math.floor(i / 5) * 3}
						width="3"
						height="3"
						rx=".6"
						fill="rgba(255,255,255,.85)"
					/>
				) : null,
			)}
		</svg>
	)
}
