import { libroVisitas } from "@stellar-scaffold/app-lib/clients"

export { libroVisitas }

/** Same limit as `MAX_MENSAJE` in contracts/libro-visitas/src/lib.rs. */
export const MAX_MENSAJE = 280

export interface Firma {
	id: number
	autor: string
	mensaje: string
	ledger: number
	timestamp: bigint
}

export const contractId = libroVisitas.options.contractId

/** Soroban `String::len()` counts UTF-8 bytes, not characters. */
const encoder = new TextEncoder()
export const byteLength = (s: string) => encoder.encode(s).length

/** Spanish copy for each variant of the contract's `Error` enum. */
const ERRORES: Record<string, string> = {
	YaFirmaste:
		"Esta wallet ya firmó el libro. El contrato solo permite una firma por dirección.",
	MensajeVacio: "El mensaje está vacío. Escribe algo antes de firmar.",
	MensajeMuyLargo: `El mensaje supera los ${MAX_MENSAJE} bytes que acepta el contrato.`,
}

const CODIGOS: Record<number, string> = {
	1: "YaFirmaste",
	2: "MensajeVacio",
	3: "MensajeMuyLargo",
}

/** Turns a contract / wallet / RPC failure into something a human can read. */
export const explicarError = (e: unknown): string => {
	const raw =
		typeof e === "object" && e && "message" in e
			? String((e as { message: unknown }).message)
			: String(e)
	for (const [nombre, texto] of Object.entries(ERRORES)) {
		if (raw.includes(nombre)) return texto
	}
	// The generated client reports contract errors with the variant's doc
	// comment from lib.rs as the message.
	if (/ya dejó su firma/i.test(raw)) return ERRORES.YaFirmaste!
	if (/mensaje está vacío/i.test(raw)) return ERRORES.MensajeVacio!
	if (/mensaje supera/i.test(raw)) return ERRORES.MensajeMuyLargo!
	const codigo = /Error\(Contract, #(\d+)\)/.exec(raw)
	const nombre = codigo ? CODIGOS[Number(codigo[1])] : undefined
	if (nombre && ERRORES[nombre]) return ERRORES[nombre]
	if (/reject|declin|denied|cancel/i.test(raw)) {
		return "Rechazaste la firma en tu wallet. No se envió nada a la red."
	}
	if (/account not found|does not exist|404/i.test(raw)) {
		return "Tu cuenta no existe todavía en testnet. Fondéala con Friendbot y vuelve a intentar."
	}
	return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw
}

export const explorerTx = (hash: string) =>
	`https://stellar.expert/explorer/testnet/tx/${hash}`
export const explorerAccount = (address: string) =>
	`https://stellar.expert/explorer/testnet/account/${address}`
export const explorerContract = (id: string) =>
	`https://stellar.expert/explorer/testnet/contract/${id}`
