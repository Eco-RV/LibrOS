import { useState } from "react"
import { contractId, explorerContract } from "../lib/contract"
import { Reveal } from "./Reveal"

type Part = "auth" | "valida" | "guarda" | "evento" | "listar"

/** Simplified view of contracts/libro-visitas/src/lib.rs, tagged by part. */
const CODE: { text: string; part?: Part }[] = [
	{ text: "#[contractimpl]" },
	{ text: "impl LibroVisitas {" },
	{ text: "  pub fn firmar(env: Env, autor: Address, mensaje: String)" },
	{ text: "      -> Result<u32, Error> {" },
	{ text: "    autor.require_auth();", part: "auth" },
	{ text: "" },
	{
		text: "    if mensaje.len() == 0 { return Err(Error::MensajeVacio) }",
		part: "valida",
	},
	{
		text: "    if mensaje.len() > 280 { return Err(Error::MensajeMuyLargo) }",
		part: "valida",
	},
	{ text: "    if storage.has(&Clave::Autor(autor)) {", part: "valida" },
	{ text: "      return Err(Error::YaFirmaste)", part: "valida" },
	{ text: "    }", part: "valida" },
	{ text: "" },
	{ text: "    let id = Self::total(env);", part: "guarda" },
	{
		text: "    let firma = Firma { id, autor, mensaje, ledger, timestamp };",
		part: "guarda",
	},
	{ text: "    storage.set(&Clave::Firma(id), &firma);", part: "guarda" },
	{ text: "    storage.set(&Clave::Autor(autor), &id);", part: "guarda" },
	{ text: "    storage.extend_ttl(…);  // paga la «renta»", part: "guarda" },
	{ text: "    instance.set(&Clave::Total, &(id + 1));", part: "guarda" },
	{ text: "" },
	{
		text: "    NuevaFirma { autor, id, mensaje }.publish(&env);",
		part: "evento",
	},
	{ text: "    Ok(id)" },
	{ text: "  }" },
	{ text: "" },
	{ text: "  pub fn listar(env: Env) -> Vec<Firma> {", part: "listar" },
	{
		text: "    (0..total).map(|id| storage.get(&Clave::Firma(id)))",
		part: "listar",
	},
	{ text: "  }", part: "listar" },
	{ text: "}" },
]

const PARTS: { id: Part; n: string; title: string; body: React.ReactNode }[] = [
	{
		id: "auth",
		n: "01",
		title: "require_auth: la firma de verdad",
		body: (
			<>
				<p>
					<code>autor</code> es solo un parámetro: cualquiera podría poner la
					dirección de otra persona. <code>require_auth()</code> le pide al host
					de Soroban que verifique que <strong>esa</strong> dirección autorizó
					exactamente esta llamada (mismo contrato, misma función, mismos
					argumentos).
				</p>
				<p>
					Si la firma no está, el contrato se detiene ahí y la transacción
					completa se revierte. Por eso es imposible firmar en nombre de otro.
				</p>
			</>
		),
	},
	{
		id: "valida",
		n: "02",
		title: "Validaciones y errores tipados",
		body: (
			<>
				<p>
					El contrato rechaza mensajes vacíos, de más de 280 bytes y{" "}
					<strong>segundas firmas</strong> de la misma wallet. Cada caso es una
					variante del enum <code>Error</code> con un código numérico.
				</p>
				<p>
					El cliente TypeScript generado conoce esos códigos, así que la app
					puede mostrarte «ya firmaste» en vez de un <code>#1</code> críptico. Y
					como la simulación falla antes de pedirte la firma, no pagas nada.
				</p>
			</>
		),
	},
	{
		id: "guarda",
		n: "03",
		title: "Almacenamiento con renta",
		body: (
			<>
				<p>
					Soroban tiene tres tipos de storage. Aquí el contador{" "}
					<code>Total</code> vive en <em>instance</em> (viaja con el contrato) y
					cada firma en <em>persistent</em>, bajo su propia clave{" "}
					<code>Firma(id)</code>.
				</p>
				<p>
					Los datos on-chain pagan <strong>renta</strong>: tienen un TTL en
					ledgers. <code>extend_ttl</code> lo alarga ~120 días para que el libro
					no se archive.
				</p>
			</>
		),
	},
	{
		id: "evento",
		n: "04",
		title: "Eventos: avisarle al mundo",
		body: (
			<>
				<p>
					<code>NuevaFirma</code> se publica con el tema <code>"firma"</code> y
					la dirección del autor. Los eventos no se guardan en el estado del
					contrato, pero quedan en el resultado de la transacción y el RPC los
					indexa.
				</p>
				<p>
					Esta página se suscribe a ellos: cuando alguien firma desde otro lado
					del mundo, el libro se actualiza solo.
				</p>
			</>
		),
	},
	{
		id: "listar",
		n: "05",
		title: "listar(): leer es gratis",
		body: (
			<>
				<p>
					<code>listar()</code> no modifica nada, así que no hace falta enviar
					una transacción. El cliente la <strong>simula</strong> contra el RPC y
					lee el resultado: sin wallet, sin comisión, instantáneo.
				</p>
				<p>
					Regla práctica: <em>leer = simular</em>,{" "}
					<em>escribir = firmar y enviar</em>.
				</p>
			</>
		),
	},
]

export const ContractAnatomy = () => {
	const [active, setActive] = useState<Part>("auth")
	const part = PARTS.find((p) => p.id === active)!

	return (
		<section id="contrato" className="section section--anatomy">
			<div className="container">
				<Reveal className="section__head">
					<p className="eyebrow">Rust · Soroban SDK</p>
					<h2 className="section__title">Anatomía del contrato</h2>
					<p className="muted">
						Toca cada pieza para ver qué línea hace qué. El código completo (con
						tests) está en <code>contracts/libro-visitas</code>.
					</p>
				</Reveal>

				<div className="anatomy">
					<Reveal className="anatomy__tabs" delay={80}>
						<div role="tablist" aria-label="Partes del contrato">
							{PARTS.map((p) => (
								<button
									key={p.id}
									role="tab"
									aria-selected={p.id === active}
									className={`atab ${p.id === active ? "is-active" : ""}`}
									onClick={() => setActive(p.id)}
								>
									<span className="atab__n">{p.n}</span>
									<span>{p.title}</span>
								</button>
							))}
						</div>
						<div className="atab__panel" key={part.id}>
							{part.body}
						</div>
					</Reveal>

					<Reveal className="code" delay={160}>
						<div className="code__bar">
							<span className="code__dots" aria-hidden="true">
								<i />
								<i />
								<i />
							</span>
							<span className="mono">src/lib.rs</span>
						</div>
						<pre className="code__body" data-active={active}>
							{CODE.map((line, i) => (
								<span
									key={i}
									className={`code__line ${line.part ? `part-${line.part}` : ""} ${line.part === active ? "is-hot" : ""}`}
									onClick={() => line.part && setActive(line.part)}
								>
									<span className="code__ln">{i + 1}</span>
									<span className="code__txt">{line.text || " "}</span>
								</span>
							))}
						</pre>
					</Reveal>
				</div>

				<div className="compare">
					<Reveal className="compare__card" delay={0}>
						<span className="compare__tag compare__tag--read">Lectura</span>
						<h3>listar(), total(), firma_de()</h3>
						<ul>
							<li>Se simula contra el RPC</li>
							<li>No necesita wallet</li>
							<li>0 XLM de comisión</li>
							<li>Respuesta inmediata</li>
						</ul>
					</Reveal>
					<Reveal className="compare__card" delay={120}>
						<span className="compare__tag compare__tag--write">Escritura</span>
						<h3>firmar(autor, mensaje)</h3>
						<ul>
							<li>Se simula, se firma y se envía</li>
							<li>Requiere la auth de tu wallet</li>
							<li>Paga comisión + renta del storage</li>
							<li>Confirmada en ~5 s (un ledger)</li>
						</ul>
					</Reveal>
					<Reveal className="compare__card compare__card--id" delay={240}>
						<span className="compare__tag">Desplegado en testnet</span>
						<h3>Contract ID</h3>
						<p className="mono break">{contractId}</p>
						<a
							className="link"
							href={explorerContract(contractId)}
							target="_blank"
							rel="noreferrer"
						>
							Ver en Stellar Expert ↗
						</a>
					</Reveal>
				</div>
			</div>
		</section>
	)
}
