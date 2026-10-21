import { subscribeToEvents } from "@stellar-scaffold/app-lib"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { contractId, type Firma, libroVisitas } from "../lib/contract"

export const GUESTBOOK_KEY = ["libro-visitas", "listar"]

/**
 * Reads every page of the guestbook. `listar()` is read-only, so the
 * generated client only *simulates* it against the RPC: no wallet, no fee.
 */
export const useGuestbook = () => {
	const queryClient = useQueryClient()

	const query = useQuery({
		queryKey: GUESTBOOK_KEY,
		queryFn: async () => {
			const tx = await libroVisitas.listar()
			return [...(tx.result as Firma[])].reverse()
		},
		refetchInterval: 30_000,
	})

	// Live updates: the contract publishes a `firma` event on every signature.
	useEffect(
		() =>
			subscribeToEvents(contractId, "firma", () => {
				void queryClient.invalidateQueries({ queryKey: GUESTBOOK_KEY })
			}),
		[queryClient],
	)

	return query
}
