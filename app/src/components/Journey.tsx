import { useEffect, useState } from "react"
import { useInView } from "../hooks/useReveal"

export const STEPS = [
	{
		id: "armar",
		actor: "Tu navegador",
		title: "Armar la invocación",
		body: "El cliente TypeScript que generó Scaffold Stellar convierte firmar(autor, mensaje) en una transacción que invoca al contrato.",
		code: "libroVisitas.firmar({ autor, mensaje })",
	},
	{
		id: "simular",
		actor: "RPC de Soroban",
		title: "Simular",
		body: "El RPC ejecuta el contrato «en seco»: calcula la comisión, qué datos va a leer y escribir (footprint) y descubre que autor debe autorizar.",
		code: "simulateTransaction(tx)",
	},
	{
		id: "autorizar",
		actor: "Tu wallet",
		title: "Autorizar",
		body: "Tu wallet firma con tu llave privada. Esa firma es lo que satisface autor.require_auth() dentro del contrato. Nadie puede firmar por ti.",
		code: "autor.require_auth()",
	},
	{
		id: "enviar",
		actor: "Red Stellar",
		title: "Enviar",
		body: "La transacción firmada viaja al RPC, que la reparte a los validadores de la red.",
		code: "sendTransaction(signedXdr)",
	},
	{
		id: "ledger",
		actor: "Validadores",
		title: "Entrar en un ledger",
		body: "Los validadores se ponen de acuerdo (consenso SCP) y cierran un ledger cada ~5 s. Ahí el contrato se ejecuta de verdad y guarda tu firma.",
		code: "storage().persistent().set(…)",
	},
	{
		id: "evento",
		actor: "Contrato → App",
		title: "Evento y lectura",
		body: "El contrato publica el evento NuevaFirma. La app lo escucha y vuelve a llamar listar(), que es solo lectura: gratis y sin wallet.",
		code: "NuevaFirma { autor, id, mensaje }.publish(&env)",
	},
] as const

export type StepId = (typeof STEPS)[number]["id"]

export type JourneyState =
	| { mode: "demo" }
	| {
			mode: "live"
			/** Index of the active step; `STEPS.length` means finished. */
			step: number
			error?: string
			detail?: Partial<Record<StepId, string>>
	  }

const DEMO_MS = 2200

export const Journey = ({ state }: { state: JourneyState }) => {
	const [ref, inView] = useInView<HTMLDivElement>(0.35)
	const [demoStep, setDemoStep] = useState(0)

	useEffect(() => {
		if (state.mode !== "demo" || !inView) return
		const t = setInterval(
			() => setDemoStep((s) => (s + 1) % (STEPS.length + 1)),
			DEMO_MS,
		)
		return () => clearInterval(t)
	}, [state.mode, inView])

	const live = state.mode === "live"
	const step = live ? state.step : demoStep
	const error = live ? state.error : undefined
	const finished = step >= STEPS.length

	return (
		<div
			ref={ref}
			id="viaje"
			className={`journey ${live ? "is-live" : "is-demo"} ${error ? "has-error" : ""} ${finished ? "is-finished" : ""}`}
		>
			<div className="journey__head">
				<p className="eyebrow">
					{live ? "En vivo · tu transacción" : "Así viaja una firma"}
				</p>
				<span className={`pill ${live ? "pill--live" : ""}`}>
					{live
						? error
							? "Falló"
							: finished
								? "Confirmada"
								: "En curso"
						: "Demo"}
				</span>
			</div>

			<ol className="journey__track">
				{STEPS.map((s, i) => {
					const status =
						error && i === step
							? "error"
							: i < step
								? "done"
								: i === step
									? "active"
									: "todo"
					const detail = live ? state.detail?.[s.id] : undefined
					return (
						<li key={s.id} className={`jstep jstep--${status}`}>
							<span className="jstep__node" aria-hidden="true">
								{status === "done" ? "✓" : status === "error" ? "!" : i + 1}
							</span>
							<div className="jstep__body">
								<span className="jstep__actor">{s.actor}</span>
								<h3 className="jstep__title">{s.title}</h3>
								<div className="jstep__more">
									<div>
										<p>{s.body}</p>
										<code className="jstep__code">{s.code}</code>
										{detail && <p className="jstep__detail">{detail}</p>}
										{status === "error" && error && (
											<p className="jstep__error">{error}</p>
										)}
									</div>
								</div>
							</div>
						</li>
					)
				})}
			</ol>
		</div>
	)
}
