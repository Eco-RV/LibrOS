import { Reveal } from "./Reveal"

const TERMS = [
	{
		t: "Wallet",
		d: "Guarda tu llave privada y firma transacciones por ti. Tu dirección (G…) es la llave pública.",
	},
	{
		t: "Contrato inteligente",
		d: "Programa (aquí en Rust, compilado a WASM) que vive en la red y que nadie puede cambiar a escondidas.",
	},
	{
		t: "Transacción",
		d: "Paquete firmado que pide a la red hacer algo: en este caso, invocar firmar() del contrato.",
	},
	{
		t: "require_auth",
		d: "Exige que una dirección haya autorizado la llamada. Es la diferencia entre «dice que es Ana» y «es Ana».",
	},
	{
		t: "Simulación",
		d: "Ejecutar el contrato sin publicar nada para saber el resultado, la comisión y los datos que tocará.",
	},
	{
		t: "Ledger",
		d: "Cada «página» del historial de Stellar. Se cierra uno cada ~5 segundos por consenso.",
	},
	{
		t: "Evento",
		d: "Mensaje que el contrato emite al ejecutarse. Las apps lo escuchan para reaccionar en tiempo real.",
	},
	{
		t: "TTL / renta",
		d: "Los datos on-chain tienen fecha de caducidad en ledgers; hay que extenderla pagando una pequeña renta.",
	},
	{
		t: "Testnet",
		d: "Red de pruebas de Stellar. El XLM no vale dinero real y Friendbot te regala para experimentar.",
	},
]

export const Glossary = () => (
	<section id="glosario" className="section section--glossary">
		<div className="container">
			<Reveal className="section__head">
				<p className="eyebrow">Para llevar</p>
				<h2 className="section__title">Glosario de la barra</h2>
			</Reveal>
			<ul className="glossary">
				{TERMS.map((term, i) => (
					<Reveal as="li" key={term.t} className="term" delay={(i % 3) * 90}>
						<h3>{term.t}</h3>
						<p>{term.d}</p>
					</Reveal>
				))}
			</ul>
		</div>
	</section>
)
