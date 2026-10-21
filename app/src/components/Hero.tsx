import { useGuestbook } from "../hooks/useGuestbook"
import { contractId, explorerContract } from "../lib/contract"

export const Hero = () => {
	const { data, isLoading } = useGuestbook()
	const total = data?.length ?? 0

	return (
		<section id="top" className="hero">
			<div className="container hero__inner">
				<p className="eyebrow hero__eyebrow">Challenge #1 · Stellar Sessions</p>

				<h1 className="hero__title">
					<span className="hero__line">El libro de visitas de la</span>
					<span className="neon" data-text="Cripto Cantina">
						Cripto Cantina
					</span>
				</h1>

				<p className="hero__lead">
					Conecta tu wallet, deja un mensaje y fírmalo con tu llave. Queda
					grabado en un contrato de <strong>Stellar</strong> para siempre
					(bueno, mientras alguien pague su renta 😉). Y de paso, entiende qué
					pasa en cada paso.
				</p>

				<div className="hero__actions">
					<a href="#firmar" className="btn btn--amber btn--big">
						Firmar el libro
						<span aria-hidden="true" className="btn__arrow">
							→
						</span>
					</a>
					<a href="#contrato" className="btn btn--ghost btn--big">
						¿Cómo funciona?
					</a>
				</div>

				<dl className="hero__stats">
					<div className="stat">
						<dt>Firmas on-chain</dt>
						<dd className="stat__value">
							{isLoading ? (
								<span className="skeleton skeleton--num" />
							) : (
								<span key={total} className="tick">
									{total}
								</span>
							)}
						</dd>
					</div>
					<div className="stat">
						<dt>Red</dt>
						<dd className="stat__value stat__value--sm">
							<span className="live-dot" /> Testnet
						</dd>
					</div>
					<div className="stat stat--wide">
						<dt>Contrato</dt>
						<dd className="stat__value stat__value--sm">
							<a
								href={explorerContract(contractId)}
								target="_blank"
								rel="noreferrer"
								className="mono link"
							>
								{contractId.slice(0, 6)}…{contractId.slice(-6)}
							</a>
						</dd>
					</div>
				</dl>
			</div>

			<a href="#firmar" className="scroll-cue" aria-label="Bajar">
				<span />
			</a>
		</section>
	)
}
