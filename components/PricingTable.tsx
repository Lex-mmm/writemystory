"use client";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

const plans = [
	{
		name: "Gratis",
		price: "€0",
		description: "Perfect om te ervaren hoe het werkt",
		features: [
			"1 biografie-project",
			"5 AI-vragen",
			"Eenvoudige stijlkeuze",
			"PDF met watermerk",
			"Online voortgang volgen",
		],
		cta: "Begin gratis",
		ctaLink: "/signup",
		highlight: false,
	},
	{
		name: "Premium",
		price: "€69",
		description: "Onze meest populaire keuze",
		features: [
			"Tot 50 vragen",
			"AI-gegenereerde hoofdstukken",
			"Foto's toevoegen",
			"Keuze uit 3 opmaakstijlen",
			"Download als printklare PDF",
			"E-mail & WhatsApp ondersteuning",
		],
		cta: "Upgrade naar Premium",
		ctaLink: "/signup",
		highlight: true,
	},
	{
		name: "Deluxe Boek",
		price: "€129",
		description: "Voor de mooiste herinneringen",
		features: [
			"Alles van Premium",
			"Persoonlijke redactie-check",
			"Hardcover boek (1 exemplaar)",
			"Extra exemplaren bij te bestellen",
			"Prioriteit ondersteuning",
			"Levenslange toegang",
		],
		cta: "Bestel Deluxe",
		ctaLink: "/signup",
		highlight: false,
	},
];

export default function PricingTable() {
	const { user } = useAuth();

	return (
		<section className="py-12">
			<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
				{plans.map((plan) => (
					<div
						key={plan.name}
						className={`border rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl ${
							plan.highlight
								? "border-blue-600 transform md:-translate-y-4"
								: "border-gray-200 hover:-translate-y-2"
						}`}
					>
						{plan.highlight && (
							<div className="bg-blue-600 text-white text-center py-2 font-medium">
								Meest gekozen
							</div>
						)}
						<div
							className={`p-8 ${
								plan.highlight ? "bg-blue-50" : "bg-white"
							}`}
						>
							<h3 className="text-2xl font-bold mb-2 text-gray-800">
								{plan.name}
							</h3>
							<p className="text-gray-600 mb-4">{plan.description}</p>
							<div className="flex items-baseline mb-6">
								<span className="text-4xl font-extrabold text-blue-600">
									{plan.price}
								</span>
								{plan.name !== "Deluxe Boek" && (
									<span className="text-gray-500 ml-1">eenmalig</span>
								)}
							</div>
							<ul className="space-y-3 mb-8">
								{plan.features.map((feature) => (
									<li key={feature} className="flex items-start gap-3">
										<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
										<span className="text-gray-700">{feature}</span>
									</li>
								))}
							</ul>
							<Link
								href={user ? "/dashboard" : plan.ctaLink}
								className={`block w-full py-3 px-4 rounded-lg text-center text-white font-semibold transition-colors ${
									plan.highlight
										? "bg-blue-600 hover:bg-blue-700"
										: "bg-gray-700 hover:bg-gray-800"
								}`}
							>
								{user ? "Naar dashboard" : plan.cta}
							</Link>
						</div>
					</div>
				))}
			</div>

			<div className="max-w-4xl mx-auto mt-16 bg-blue-50 rounded-xl p-8 border border-blue-100">
				<h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
					Veelgestelde vragen
				</h3>
				<div className="grid md:grid-cols-2 gap-6">
					<div>
						<h4 className="font-semibold text-lg mb-2 text-gray-800">
							Hoe werkt de betaling?
						</h4>
						<p className="text-gray-600">
							Je betaalt eenmalig en krijgt daarna toegang tot alle functies van
							het gekozen pakket.
						</p>
					</div>
					<div>
						<h4 className="font-semibold text-lg mb-2 text-gray-800">
							Kan ik later upgraden?
						</h4>
						<p className="text-gray-600">
							Ja, je kunt op elk moment upgraden naar een hoger pakket.
						</p>
					</div>
					<div>
						<h4 className="font-semibold text-lg mb-2 text-gray-800">
							Hoe lang heb ik toegang?
						</h4>
						<p className="text-gray-600">
							Bij Premium heb je 1 jaar toegang, bij Deluxe heb je levenslange
							toegang tot je verhaal.
						</p>
					</div>
					<div>
						<h4 className="font-semibold text-lg mb-2 text-gray-800">
							Hoe lang duurt het maken van een boek?
						</h4>
						<p className="text-gray-600">
							De productie van een hardcover boek duurt ongeveer 2-3 weken na
							goedkeuring van je verhaal.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
