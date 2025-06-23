import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-8 text-gray-800">
        <h1 className="text-4xl font-extrabold text-center text-gray-900">Over writemystory.ai</h1>

        {/* Add image here */}
        <div className="flex justify-center">
          <Image
            src="/images/lex.png"
            alt="Lex van Loon"
            width={300}
            height={300}
            className="rounded-full"
          />
        </div>

        <section className="space-y-4">
          <p>
            Sommige verhalen verdienen het om nooit verloren te gaan.
          </p>
          <p>
            Als liefhebber van geschiedenis en biografieën heb ik tientallen levensverhalen gelezen — van Nietzsche tot Nelson Mandela, van Erasmus tot Elon Musk. Wat me telkens weer raakt, is de kracht van een goed verteld leven: hoe herinneringen, keuzes en toevalligheden samen een uniek mens vormen.
          </p>
          <p>
            In mijn werk in de gezondheidszorg zie ik dagelijks wat technologie kan betekenen. Mijn collega’s ontwikkelden daar al een AI-model dat veilig en betrouwbaar medische brieven opstelt. Diezelfde techniek — slim, ondersteunend en betrouwbaar — inspireerde mij om iets te bouwen dat mensen helpt hun eigen verhaal te vertellen.
          </p>
          <p>
            Maar mijn diepste motivatie is persoonlijk. Mijn kinderen zijn allebei te vroeg geboren. Die eerste weken in het ziekenhuis waren intens, waardevol, maar ook overweldigend. Ik had zó graag een boekje gehad waarin ik hun begin kon vastleggen — de kleine overwinningen, de emoties, de momenten. Maar ik had simpelweg niet de tijd, laat staan de cognitieve ruimte om daar rustig voor te gaan zitten.
          </p>
          <p>
            Wat ik wél kon, was reageren op appjes. Even vertellen hoe het ging als iemand langs kwam. Hoe mooi zou het zijn als die losse momentjes, die stukjes tekst en emotie, automatisch worden gebundeld tot een verhaal? Dat idee raakte me. En precies dat wil ik met writemystory.ai mogelijk maken.
          </p>
          <p>
            Met <strong>writemystory.ai</strong> wil ik die brug slaan: tussen herinnering en verhaal, tussen mens en machine, tussen nu en later.
          </p>

        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-2">Wie ben ik?</h2>
          <p>
            Mijn naam is Lex van Loon. Als technisch geneeskundige werk ik op het snijvlak van technologie en zorg. Dagelijks probeer ik nieuwe technieken en modellen te gebruiken om patiënten beter te helpen — en nu dus ook om herinneringen te bewaren.
          </p>
          <p>
            writemystory.ai is mijn persoonlijke missie: technologie gebruiken om iets wezenlijks vast te leggen. Niet voor de cloud, maar voor de familie. Voor nu en voor later.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
