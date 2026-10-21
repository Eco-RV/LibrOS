import { contractId, explorerContract } from "../lib/contract"

export const Footer = () => (
	<footer className="footer">
		<div className="container footer__inner">
			<p className="footer__brand">
				Libr<em>OS</em> · hecho para el Challenge #1 de Stellar Sessions
			</p>
			<nav className="footer__nav">
				<a href="https://github.com/Eco-RV/LibrOS" target="_blank" rel="noreferrer">
					Código en GitHub
				</a>
				<a href={explorerContract(contractId)} target="_blank" rel="noreferrer">
					Contrato
				</a>
				<a href="https://scaffoldstellar.org" target="_blank" rel="noreferrer">
					Scaffold Stellar
				</a>
				<a href="https://developers.stellar.org/docs/build/smart-contracts/overview" target="_blank" rel="noreferrer">
					Docs de Soroban
				</a>
			</nav>
		</div>
	</footer>
)
