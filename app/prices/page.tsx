import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import PricingTable from "../../components/PricingTable";

export default function PrijzenPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-4">
              Schrijf <span className="text-blue-600">jouw verhaal</span>
            </h1>
            <p className="max-w-xl mx-auto text-xl text-gray-500">
              Kies het pakket dat bij jou past en begin vandaag met het vastleggen van jouw herinneringen voor toekomstige generaties.
            </p>
          </div>
          <PricingTable />
        </div>
      </main>
      <Footer />
    </>
  );
}
