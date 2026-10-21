import {
	connectWallet,
	fundAccount,
	networkPassphrase as appNetwork,
} from "@stellar-scaffold/app-lib"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { type CSSProperties, useState } from "react"
import { GUESTBOOK_KEY } from "../hooks/useGuestbook"
import { useWallet } from "../hooks/useWallet"
import {
	byteLength,
	explicarError,
	explorerTx,
	type Firma,
	libroVisitas,
	MAX_MENSAJE,
} from "../lib/contract"
import { type JourneyState, type StepId } from "./Journey"
import { Seal } from "./Seal"

const SUGERENCIAS = [
	"gm desde la barra 🍹",
	"Mi primera firma on-chain. No se lo digan a mi mamá.",
	"require_auth() me dio más seguridad que mi banco",
	"Una ronda de lumens para todos ✨",
]

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Phase =
	| { kind: "idle" }
	| { kind: "working" }
	| { kind: "ok"; hash?: string; id?: number }
	| { kind: "error"; message: string }

export const SignForm = ({
	onJourney,
}: {
	onJourney: (s: JourneyState) => void
}) => {
	const { address, balances, networkPassphrase, signTransaction, updateBalances } =
		useWallet()
	const queryClient = useQueryClient()
	const [mensaje, setMensaje] = useState("")
	const [phase, setPhase] = useState<Phase>({ kind: "idle" })
	const [funding, setFunding] = useState(false)

	const yaFirmo = useQuery({
		queryKey: ["libro-visitas", "firma_de", address],
		enabled: !!address,
		queryFn: async () => {
			const tx = await libroVisitas.firma_de({ autor: address! })
			return (tx.result as Firma | undefined) ?? null
		},
	})

	const bytes = byteLength(mensaje.trim())
	const tooLong = bytes > MAX_MENSAJE
	const wrongNetwork =
		!!address && !!networkPassphrase && networkPassphrase !== appNetwork
	const sinFondos = !!address && !balances?.xlm?.balance
	const working = phase.kind === "working"

	const firmar = async () => {
		if (!address || !mensaje.trim() || tooLong) return
		const texto = mensaje.trim()
		const detail: Partial<Record<StepId, string>> = {}
		let step = 0
		const go = (n: number, extra?: Partial<Record<StepId, string>>) => {
			step = n
			Object.assign(detail, extra)
			onJourney({ mode: "live", step, detail: { ...detail } })
		}

		setPhase({ kind: "working" })
		document.getElementById("viaje")?.scrollIntoView({ behavior: "smooth", block: "nearest" })

		try {
			// 1 + 2 · build the invocation and simulate it against the RPC
			go(0)
			await pause(450)
			go(1)
			const tx = await libroVisitas.firmar(
				{ autor: address, mensaje: texto },
				{ publicKey: address },
			)
			const sim = tx.result as { isErr?: () => boolean; unwrapErr?: () => unknown }
			if (sim?.isErr?.()) throw sim.unwrapErr?.()
			go(2, { simular: describeSimulation(tx) })

			// 3 + 4 · the wallet signs, then the client submits and polls
			let enLedger: ReturnType<typeof setTimeout> | undefined
			const sent = await tx.signAndSend({
				signTransaction: async (xdr, opts) => {
					const signed = await signTransaction(xdr, opts)
					go(3, { autorizar: "Firmada con tu llave privada ✍️" })
					enLedger = setTimeout(() => go(4), 1300)
					return signed
				},
			})
			clearTimeout(enLedger)
			const res = sent.result as { isErr?: () => boolean; unwrapErr?: () => unknown; unwrap?: () => number }
			if (res?.isErr?.()) throw res.unwrapErr?.()

			const hash = sent.sendTransactionResponse?.hash
			const ledger = sent.getTransactionResponse && "ledger" in sent.getTransactionResponse
				? sent.getTransactionResponse.ledger
				: undefined
			const id = res?.unwrap?.()
			go(5, {
				ledger: ledger ? `Incluida en el ledger #${ledger.toLocaleString("es")}` : undefined,
			})

			// 5 · the event fired; re-read the book
			await queryClient.invalidateQueries({ queryKey: GUESTBOOK_KEY })
			await queryClient.invalidateQueries({ queryKey: ["libro-visitas", "firma_de", address] })
			go(6, { evento: id !== undefined ? `Evento NuevaFirma · página #${id}` : undefined })
			setPhase({ kind: "ok", hash, id })
			setMensaje("")
			void updateBalances()
		} catch (e) {
			const message = explicarError(e)
			onJourney({ mode: "live", step, error: message, detail: { ...detail } })
			setPhase({ kind: "error", message })
		}
	}

	const fondear = async () => {
		if (!address) return
		setFunding(true)
		const { ok, message } = await fundAccount(address)
		if (ok) await updateBalances()
		else setPhase({ kind: "error", message })
		setFunding(false)
	}

	const firmaPrevia = yaFirmo.data

	return (
		<div className="signcard">
			<p className="eyebrow">Paso a paso</p>
			<h2 className="section__title">Deja tu firma</h2>
			<p className="muted">
				Una firma por wallet. Lo que escribas queda en testnet y cualquiera
				puede leerlo.
			</p>

			{!address ? (
				<div className="signcard__gate">
					<ol className="mini-steps">
						<li>
							Instala una wallet como <strong>Freighter</strong> y cámbiala a{" "}
							<strong>Testnet</strong>.
						</li>
						<li>Conéctala aquí.</li>
						<li>Escribe, firma y mira el viaje →</li>
					</ol>
					<button className="btn btn--amber btn--big" onClick={() => void connectWallet()}>
						Conectar wallet
					</button>
				</div>
			) : firmaPrevia ? (
				<div className="signcard__done">
					<div className="signed-badge">
						<Seal address={address} size={56} />
						<div>
							<strong>Ya firmaste el libro</strong>
							<p className="muted">Página #{firmaPrevia.id} · el contrato solo acepta una por dirección.</p>
						</div>
					</div>
					<blockquote className="handwritten">“{firmaPrevia.mensaje}”</blockquote>
					{phase.kind === "ok" && <Sparks />}
					{phase.kind === "ok" && phase.hash && (
						<a className="link" href={explorerTx(phase.hash)} target="_blank" rel="noreferrer">
							Ver tu transacción en Stellar Expert ↗
						</a>
					)}
					<a href="#libro" className="btn btn--ghost">Ver el libro ↓</a>
				</div>
			) : (
				<form
					className="signform"
					onSubmit={(e) => {
						e.preventDefault()
						void firmar()
					}}
				>
					{wrongNetwork && (
						<p className="callout callout--warn">
							Tu wallet está en otra red. Cámbiala a <strong>Testnet</strong> para firmar.
						</p>
					)}
					{sinFondos && (
						<div className="callout">
							<span>
								Tu cuenta necesita un poco de XLM de prueba para pagar la comisión.
							</span>
							<button type="button" className="btn btn--small" onClick={() => void fondear()} disabled={funding}>
								{funding ? "Fondeando…" : "Pedir a Friendbot"}
							</button>
						</div>
					)}

					<label className="field">
						<span className="field__label">Tu mensaje</span>
						<textarea
							value={mensaje}
							onChange={(e) => {
								setMensaje(e.target.value)
								if (phase.kind === "error") setPhase({ kind: "idle" })
							}}
							placeholder="Escribe algo para la posteridad…"
							rows={4}
							disabled={working}
							maxLength={MAX_MENSAJE * 2}
						/>
						<span
							className={`counter ${tooLong ? "is-over" : ""}`}
							style={{ "--fill": Math.min(bytes / MAX_MENSAJE, 1) } as CSSProperties}
						>
							<span className="counter__ring" aria-hidden="true" />
							{bytes}/{MAX_MENSAJE} bytes
						</span>
					</label>

					<div className="chips" aria-label="Sugerencias">
						{SUGERENCIAS.map((s) => (
							<button type="button" key={s} className="chip" onClick={() => setMensaje(s)} disabled={working}>
								{s}
							</button>
						))}
					</div>

					<button
						type="submit"
						className={`btn btn--amber btn--big btn--block ${working ? "is-loading" : ""}`}
						disabled={working || !mensaje.trim() || tooLong || wrongNetwork}
					>
						{working ? "Firmando…" : "Firmar con mi wallet ✍️"}
					</button>

					{phase.kind === "error" && (
						<p className="callout callout--error" role="alert">
							{phase.message}
						</p>
					)}
				</form>
			)}
		</div>
	)
}

/** Fee + footprint numbers from the simulation, for the journey panel. */
const describeSimulation = (tx: unknown) => {
	type Resources = {
		resources: () => {
			footprint: () => { readOnly: () => unknown[]; readWrite: () => unknown[] }
		}
	}
	const t = tx as {
		simulation?: { minResourceFee?: string }
		// SorobanTransactionData XDR, or a SorobanDataBuilder in older SDKs
		simulationData?: { transactionData: Resources | { build: () => Resources } }
	}
	const fee = Number(t.simulation?.minResourceFee ?? 0) / 1e7
	const parts = [`Comisión de recursos ≈ ${fee.toFixed(4)} XLM (incluye la renta del storage)`]
	try {
		const data = t.simulationData?.transactionData
		const xdr = data && "build" in data ? data.build() : data
		const fp = xdr?.resources().footprint()
		if (fp) parts.push(`lee ${fp.readOnly().length} · escribe ${fp.readWrite().length} entradas`)
	} catch {
		// footprint details are a nice-to-have
	}
	return parts.join(" · ")
}

const Sparks = () => (
	<span className="sparks" aria-hidden="true">
		{Array.from({ length: 18 }, (_, i) => (
			<span
				key={i}
				style={
					{
						"--a": `${(360 / 18) * i}deg`,
						"--d": `${70 + ((i * 37) % 60)}px`,
						"--h": `${40 + ((i * 53) % 30)}`,
					} as CSSProperties
				}
			/>
		))}
	</span>
)
