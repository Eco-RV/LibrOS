import { shortAddress } from "@stellar-scaffold/app-lib"
import { type CSSProperties, useState } from "react"
import { useGuestbook } from "../hooks/useGuestbook"
import { useWallet } from "../hooks/useWallet"
import { explorerAccount, type Firma } from "../lib/contract"
import { Reveal } from "./Reveal"
import { Seal } from "./Seal"

const PAGE = 12

const fecha = (ts: bigint) =>
	new Date(Number(ts) * 1000).toLocaleString("es", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	})

export const Guestbook = () => {
	const { data, isLoading, isError, refetch, isFetching } = useGuestbook()
	const { address } = useWallet()
	const [visible, setVisible] = useState(PAGE)
	const firmas = data ?? []

	return (
		<section id="libro" className="section section--book">
			<div className="container">
				<Reveal className="section__head">
					<p className="eyebrow">Leído directo del contrato con listar()</p>
					<h2 className="section__title">El libro</h2>
					<p className="muted">
						Leer es gratis: la app solo <em>simula</em> la llamada contra el
						RPC, sin wallet ni comisión. Las firmas nuevas aparecen solas
						gracias al evento <code>firma</code>.
					</p>
					<button
						className="btn btn--ghost btn--small"
						onClick={() => void refetch()}
						disabled={isFetching}
					>
						<span className={isFetching ? "spin" : ""} aria-hidden="true">
							↻
						</span>{" "}
						{isFetching ? "Leyendo…" : "Releer"}
					</button>
				</Reveal>

				<div className="book">
					{isLoading &&
						Array.from({ length: 6 }, (_, i) => (
							<div key={i} className="page page--skeleton">
								<span className="skeleton skeleton--line" />
								<span className="skeleton skeleton--line short" />
							</div>
						))}

					{isError && (
						<p className="callout callout--error">
							No pude leer el contrato. ¿Está bien configurada la red?
						</p>
					)}

					{!isLoading && !isError && firmas.length === 0 && (
						<p className="book__empty handwritten">
							El libro está en blanco. ¡Sé la primera firma!
						</p>
					)}

					{firmas.slice(0, visible).map((f, i) => (
						<Page key={f.id} firma={f} mine={f.autor === address} index={i} />
					))}
				</div>

				{firmas.length > visible && (
					<div className="center">
						<button
							className="btn btn--ghost"
							onClick={() => setVisible((v) => v + PAGE)}
						>
							Pasar la página ({firmas.length - visible} más)
						</button>
					</div>
				)}
			</div>
		</section>
	)
}

const Page = ({
	firma,
	mine,
	index,
}: {
	firma: Firma
	mine: boolean
	index: number
}) => {
	const [open, setOpen] = useState(false)
	return (
		<article
			className={`page ${mine ? "page--mine" : ""} ${open ? "is-open" : ""}`}
			style={
				{
					"--tilt": `${((firma.id * 7) % 5) - 2}deg`,
					"--i": index % PAGE,
				} as CSSProperties
			}
			onClick={() => setOpen((o) => !o)}
		>
			<span className="page__num">#{firma.id}</span>
			{mine && <span className="page__mine">tu firma</span>}
			<p className="page__msg handwritten">{firma.mensaje}</p>
			<footer className="page__foot">
				<Seal address={firma.autor} size={36} />
				<div className="page__meta">
					<span className="mono">{shortAddress(firma.autor)}</span>
					<span className="muted">
						{fecha(firma.timestamp)} · ledger{" "}
						{firma.ledger.toLocaleString("es")}
					</span>
				</div>
			</footer>
			<div className="page__extra">
				<div>
					<p className="mono page__addr">{firma.autor}</p>
					<a
						href={explorerAccount(firma.autor)}
						target="_blank"
						rel="noreferrer"
						className="link"
						onClick={(e) => e.stopPropagation()}
					>
						Ver cuenta en Stellar Expert ↗
					</a>
				</div>
			</div>
		</article>
	)
}
