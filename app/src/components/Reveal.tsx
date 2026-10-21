import { type CSSProperties, type ReactNode } from "react"
import { useReveal } from "../hooks/useReveal"

/** Fades + lifts its children in the first time they scroll into view. */
export const Reveal = ({
	children,
	delay = 0,
	className = "",
	as: Tag = "div",
}: {
	children: ReactNode
	delay?: number
	className?: string
	as?: "div" | "section" | "li" | "header"
}) => {
	const [ref, visible] = useReveal<HTMLDivElement>()
	return (
		<Tag
			// @ts-expect-error ref type is shared by every allowed tag
			ref={ref}
			className={`reveal ${visible ? "is-visible" : ""} ${className}`}
			style={{ "--delay": `${delay}ms` } as CSSProperties}
		>
			{children}
		</Tag>
	)
}
