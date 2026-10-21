import {
	connectWallet,
	profileModal,
	shortAddress,
} from "@stellar-scaffold/app-lib"
import { useEffect, useState } from "react"
import { useWallet } from "../hooks/useWallet"

const LINKS = [
	{ href: "#firmar", label: "Firmar" },
	{ href: "#libro", label: "El libro" },
	{ href: "#contrato", label: "El contrato" },
	{ href: "#glosario", label: "Glosario" },
]

export const Header = () => {
	const { address, isPending, balances } = useWallet()
	const [scrolled, setScrolled] = useState(false)

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 24)
		onScroll()
		window.addEventListener("scroll", onScroll, { passive: true })
		return () => window.removeEventListener("scroll", onScroll)
	}, [])

	return (
		<header className={`topbar ${scrolled ? "is-scrolled" : ""}`}>
			<div className="container topbar__inner">
				<a href="#top" className="brand" aria-label="LibrOS, inicio">
					<span className="brand__mark" aria-hidden="true">
						<svg viewBox="0 0 32 32" width="28" height="28">
							<path
								d="M4 7c4-2 8-2 12 1 4-3 8-3 12-1v18c-4-2-8-2-12 1-4-3-8-3-12-1z"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinejoin="round"
							/>
							<path d="M16 8v18" stroke="currentColor" strokeWidth="2" />
							<path
								d="M23.5 4.5l1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"
								fill="currentColor"
							/>
						</svg>
					</span>
					<span className="brand__name">
						Libr<em>OS</em>
					</span>
				</a>

				<nav className="topbar__nav" aria-label="Secciones">
					{LINKS.map((l) => (
						<a key={l.href} href={l.href}>
							{l.label}
						</a>
					))}
				</nav>

				{address ? (
					<button
						className="wallet-chip"
						onClick={() => void profileModal()}
						title="Ver cuenta / desconectar"
					>
						<span className="wallet-chip__dot" />
						<span className="wallet-chip__bal">
							{balances?.xlm?.balance
								? `${Number(balances.xlm.balance).toLocaleString("es", { maximumFractionDigits: 2 })} XLM`
								: "0 XLM"}
						</span>
						<span className="mono">{shortAddress(address)}</span>
					</button>
				) : (
					<button
						className="btn btn--small btn--amber"
						onClick={() => void connectWallet()}
						disabled={isPending}
					>
						{isPending ? "Cargando…" : "Conectar wallet"}
					</button>
				)}
			</div>
		</header>
	)
}
