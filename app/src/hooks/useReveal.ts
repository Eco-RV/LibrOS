import { useEffect, useRef, useState } from "react"

/** Flips to `true` the first time the element scrolls into view. */
export const useReveal = <T extends HTMLElement>(threshold = 0.18) => {
	const ref = useRef<T>(null)
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		const el = ref.current
		if (!el) return
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setVisible(true)
					io.disconnect()
				}
			},
			{ threshold, rootMargin: "0px 0px -8% 0px" },
		)
		io.observe(el)
		return () => io.disconnect()
	}, [threshold])

	return [ref, visible] as const
}

/** Whether `el` is currently on screen (keeps updating). */
export const useInView = <T extends HTMLElement>(threshold = 0.3) => {
	const ref = useRef<T>(null)
	const [inView, setInView] = useState(false)

	useEffect(() => {
		const el = ref.current
		if (!el) return
		const io = new IntersectionObserver(
			([entry]) => setInView(!!entry?.isIntersecting),
			{ threshold },
		)
		io.observe(el)
		return () => io.disconnect()
	}, [threshold])

	return [ref, inView] as const
}
