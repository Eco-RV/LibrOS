import { useState } from "react"
import { ContractAnatomy } from "./components/ContractAnatomy"
import { Footer } from "./components/Footer"
import { Glossary } from "./components/Glossary"
import { Guestbook } from "./components/Guestbook"
import { Header } from "./components/Header"
import { Hero } from "./components/Hero"
import { Journey, type JourneyState } from "./components/Journey"
import { SignForm } from "./components/SignForm"

function App() {
	// The signing form drives the journey diagram with the real phases of
	// the transaction; when idle the diagram plays a demo loop instead.
	const [journey, setJourney] = useState<JourneyState>({ mode: "demo" })

	return (
		<>
			<div className="ambient" aria-hidden="true">
				<span className="orb orb--a" />
				<span className="orb orb--b" />
				<span className="orb orb--c" />
			</div>
			<Header />
			<main>
				<Hero />
				<section id="firmar" className="section section--sign">
					<div className="container sign-grid">
						<SignForm onJourney={setJourney} />
						<Journey state={journey} />
					</div>
				</section>
				<Guestbook />
				<ContractAnatomy />
				<Glossary />
			</main>
			<Footer />
		</>
	)
}

export default App
